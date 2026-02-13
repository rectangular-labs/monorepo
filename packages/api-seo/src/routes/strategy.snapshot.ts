import { ORPCError } from "@orpc/server";
import { contentKeywordSchema } from "@rectangular-labs/core/schemas/keyword-parsers";
import {
  keywordSnapshotSchema,
  snapshotAggregateSchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { schema } from "@rectangular-labs/db";
import {
  aggregateLatestSnapshotKeywords,
  getContentDraftWithLatestMetricSnapshot,
  getLatestStrategySnapshotWithContents,
  getSeoProjectByIdentifierAndOrgId,
  listContentSnapshotInRange,
  listStrategySnapshotsInRange,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import {
  configureDataForSeoClient,
  fetchKeywordsOverviewWithCache,
  getLocationAndLanguage,
} from "../lib/dataforseo/utils";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";
import { validateStrategyMiddleware } from "../lib/middleware/validate-strategy";
import { createTask } from "../lib/task";

const snapshotPointSchema = type({
  snapshotId: "string.uuid",
  takenAt: "Date",
  aggregate: type({
    "...": snapshotAggregateSchema,
    ctr: "number",
  }),
});

const sortOrderSchema = type("'asc' | 'desc'");
const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateStrategyMiddleware, (input) => ({
    projectId: input.projectId,
    strategyId: input.strategyId,
  }))
  .output(type({ taskId: "string" }))
  .handler(async ({ context, input }) => {
    const taskResult = await createTask({
      db: context.db,
      userId: context.user?.id,
      input: {
        type: "seo-generate-strategy-snapshot",
        projectId: input.projectId,
        organizationId: context.organization.id,
        strategyId: input.strategyId,
        phaseId: null,
        triggerType: "manual",
        userId: context.user.id,
      },
      workflowInstanceId: `strategy_snapshot_manual_${input.strategyId}_${crypto.randomUUID().slice(0, 6)}`,
    });

    if (!taskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to queue strategy snapshot.",
        cause: taskResult.error,
      });
    }

    return { taskId: taskResult.value.id };
  });

const series = withOrganizationIdBase
  .route({ method: "GET", path: "/series" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
      months: "1<=number<=12 = 3",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateStrategyMiddleware, (input) => ({
    projectId: input.projectId,
    strategyId: input.strategyId,
  }))
  .output(
    type({
      points: snapshotPointSchema.array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const snapshotsResult = await listStrategySnapshotsInRange({
      db: context.db,
      strategyId: input.strategyId,
      months: input.months ?? 3,
    });
    if (!snapshotsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy snapshot series.",
        cause: snapshotsResult.error,
      });
    }

    return {
      points: snapshotsResult.value.map((snapshot) => ({
        snapshotId: snapshot.id,
        takenAt: snapshot.takenAt,
        aggregate: {
          ...snapshot.aggregate,
          ctr:
            snapshot.aggregate.impressions > 0
              ? snapshot.aggregate.clicks / snapshot.aggregate.impressions
              : 0,
        },
      })),
    };
  });

const contentList = withOrganizationIdBase
  .route({ method: "GET", path: "/content" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
      "sortBy?": type(
        "'clicks'|'impressions'|'ctr'|'avgPosition'|'title'|'status'",
      ),
      "sortOrder?": sortOrderSchema,
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateStrategyMiddleware, (input) => ({
    projectId: input.projectId,
    strategyId: input.strategyId,
  }))
  .output(
    type({
      snapshot: type({
        id: "string.uuid",
        takenAt: "Date",
      }).or(type.null),
      rows: type
        .merge(
          schema.seoStrategySnapshotContentSelectSchema.pick(
            "contentDraftId",
            "topKeywords",
            "id",
          ),
          schema.seoContentDraftSelectSchema.pick(
            "title",
            "slug",
            "role",
            "status",
            "primaryKeyword",
          ),
          {
            aggregate: type({
              "...": snapshotAggregateSchema,
              ctr: "number",
            }),
          },
        )
        .array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const latestSnapshotResult = await getLatestStrategySnapshotWithContents({
      db: context.db,
      strategyId: input.strategyId,
    });
    if (!latestSnapshotResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content snapshot.",
        cause: latestSnapshotResult.error,
      });
    }

    const latestSnapshot = latestSnapshotResult.value;
    if (!latestSnapshot) {
      return { snapshot: null, rows: [] };
    }

    const sortBy = input.sortBy ?? "clicks";
    const sortOrder = input.sortOrder ?? "desc";
    const rows = latestSnapshot.contentSnapshots
      .filter((row) => row.contentDraft !== null)
      .map((row) => {
        return {
          id: row.id,
          contentDraftId: row.contentDraftId,
          topKeywords: row.topKeywords,
          title: row.contentDraft.title ?? "Untitled",
          slug: row.contentDraft.slug,
          role: row.contentDraft.role,
          status: row.contentDraft.status,
          primaryKeyword: row.contentDraft.primaryKeyword,
          aggregate: {
            ...row.aggregate,
            ctr:
              row.aggregate.impressions > 0
                ? row.aggregate.clicks / row.aggregate.impressions
                : 0,
          },
        };
      })
      .sort((a, b) => {
        const direction = sortOrder === "asc" ? 1 : -1;
        switch (sortBy) {
          case "title":
            return a.title.localeCompare(b.title) * direction;
          case "status":
            return a.status.localeCompare(b.status) * direction;
          case "impressions":
            return (
              (a.aggregate.impressions - b.aggregate.impressions) * direction
            );
          case "ctr":
            return (a.aggregate.ctr - b.aggregate.ctr) * direction;
          case "avgPosition":
            return (
              (a.aggregate.avgPosition - b.aggregate.avgPosition) * direction
            );
          default:
            return (a.aggregate.clicks - b.aggregate.clicks) * direction;
        }
      });

    return {
      snapshot: {
        id: latestSnapshot.id,
        takenAt: latestSnapshot.takenAt,
      },
      rows,
    };
  });

const contentDetails = withOrganizationIdBase
  .route({
    method: "GET",
    path: "/content/{contentDraftId}",
  })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
      contentDraftId: "string.uuid",
      "months?": "1<=number<=12",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateStrategyMiddleware, (input) => ({
    projectId: input.projectId,
    strategyId: input.strategyId,
  }))
  .output(
    type({
      contentDraft: schema.seoContentDraftSelectSchema.pick(
        "id",
        "title",
        "slug",
        "primaryKeyword",
        "status",
        "role",
      ),
      metricSnapshot: type
        .merge(
          schema.seoStrategySnapshotContentSelectSchema.pick(
            "id",
            "topKeywords",
          ),
          {
            snapshot: schema.seoStrategySnapshotSelectSchema.pick(
              "id",
              "takenAt",
            ),
          },
        )
        .or(type.null),
      primaryKeywordOverview: contentKeywordSchema.or(type.null),
      series: snapshotPointSchema.array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const latestContentResult = await getContentDraftWithLatestMetricSnapshot({
      db: context.db,
      strategyId: input.strategyId,
      contentDraftId: input.contentDraftId,
    });
    if (!latestContentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content snapshot details.",
        cause: latestContentResult.error,
      });
    }

    if (!latestContentResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "Content draft not found.",
      });
    }

    const contentSeriesResult = await listContentSnapshotInRange({
      db: context.db,
      strategyId: input.strategyId,
      contentDraftId: input.contentDraftId,
      months: input.months ?? 3,
    });
    if (!contentSeriesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content snapshot series.",
        cause: contentSeriesResult.error,
      });
    }

    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.projectId,
      context.organization.id,
      { businessBackground: true },
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load project.",
        cause: projectResult.error,
      });
    }

    const project = projectResult.value;
    if (!project) {
      throw new ORPCError("NOT_FOUND", {
        message: `Project not found for ${input.projectId}.`,
      });
    }

    const primaryKeyword = latestContentResult.value.primaryKeyword.trim();
    const { locationName, languageCode } = getLocationAndLanguage(project);
    configureDataForSeoClient();
    const keywordOverviewResult = await fetchKeywordsOverviewWithCache({
      keywords: [primaryKeyword],
      includeGenderAndAgeDistribution: false,
      locationName,
      languageCode,
      cacheKV: context.cacheKV,
    });
    if (!keywordOverviewResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load keyword overview.",
        cause: keywordOverviewResult.error,
      });
    }

    const primaryKeywordOverview =
      keywordOverviewResult.value.keywords[0] ?? null;

    const metricSnapshot = latestContentResult.value.metricSnapshots[0] ?? null;
    return {
      contentDraft: latestContentResult.value,
      metricSnapshot,
      primaryKeywordOverview,
      series: contentSeriesResult.value
        .map((point) => {
          const aggregate = point.contentSnapshots[0]?.aggregate;
          if (!aggregate) return null;
          return {
            snapshotId: point.id,
            takenAt: point.takenAt,
            aggregate: {
              ...aggregate,
              ctr:
                aggregate.impressions > 0
                  ? aggregate.clicks / aggregate.impressions
                  : 0,
            },
          };
        })
        .filter((point) => point !== null),
    };
  });

const keywordsList = withOrganizationIdBase
  .route({ method: "GET", path: "/keywords" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateStrategyMiddleware, (input) => ({
    projectId: input.projectId,
    strategyId: input.strategyId,
  }))
  .output(
    type({
      snapshot: type({
        id: "string.uuid",
        takenAt: "Date",
      }).or(type.null),
      rows: type({
        "...": keywordSnapshotSchema.pick("clicks", "impressions", "keyword"),
        avgPosition: "number",
        ctr: "number",
      }).array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const result = await aggregateLatestSnapshotKeywords({
      db: context.db,
      strategyId: input.strategyId,
    });
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy keywords.",
        cause: result.error,
      });
    }

    return {
      snapshot: result.value.snapshot,
      rows: result.value.rows,
    };
  });

export default base
  .prefix(
    "/organization/{organizationIdentifier}/project/{projectId}/strategy/{strategyId}/snapshot",
  )
  .router({
    create,
    series,
    content: {
      list: contentList,
      details: contentDetails,
    },
    keywords: {
      list: keywordsList,
    },
  });
