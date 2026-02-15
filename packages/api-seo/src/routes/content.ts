import { ORPCError } from "@orpc/server";
import { contentKeywordSchema } from "@rectangular-labs/core/schemas/keyword-parsers";
import { snapshotAggregateSchema } from "@rectangular-labs/core/schemas/strategy-parsers";
import { schema } from "@rectangular-labs/db";
import {
  createContent,
  getContentDraftWithLatestMetricSnapshot,
  getDraftById,
  getNextVersionForSlug,
  getSeoProjectByIdentifierAndOrgId,
  listContentDraftsWithLatestSnapshot,
  listContentSnapshotInRange,
  listDraftsForExportByIds,
  updateContentDraft,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { publishToIntegrations } from "../lib/content/publish-to-integrations";
import { writeContentDraft } from "../lib/content/write-content-draft";
import { createSignature } from "../lib/create-signature";
import {
  configureDataForSeoClient,
  fetchKeywordsOverviewWithCache,
  getLocationAndLanguage,
} from "../lib/dataforseo/utils";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";
import {
  DRAFT_NOT_FOUND_ERROR_MESSAGE,
  SLUG_NOT_AVAILABLE_ERROR_MESSAGE,
} from "../lib/workspace/constants";

const contentDraftSummarySchema = schema.seoContentDraftSelectSchema.omit(
  "contentMarkdown",
  "outline",
);

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/draft/list" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      "strategyId?": "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      rows: type
        .merge(
          schema.seoContentDraftSelectSchema.pick(
            "id",
            "title",
            "slug",
            "status",
            "role",
            "primaryKeyword",
            "strategyId",
          ),
          schema.seoStrategySnapshotContentSelectSchema.pick("topKeywords"),
          {
            strategyName: "string|null",
            aggregate: type({
              "...": snapshotAggregateSchema,
              ctr: "number",
            }).or(type.null),
          },
        )
        .array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listContentDraftsWithLatestSnapshot({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      strategyId: input.strategyId,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content overview rows.",
        cause: rowsResult.error,
      });
    }

    return {
      rows: rowsResult.value.map((row) => {
        const metricSnapshot = row.metricSnapshots[0] ?? null;
        const aggregate = metricSnapshot?.aggregate ?? null;
        return {
          ...row,
          topKeywords: metricSnapshot?.topKeywords ?? [],
          strategyName: row.strategy?.name ?? null,
          aggregate: aggregate
            ? {
                ...aggregate,
                ctr:
                  aggregate.impressions > 0
                    ? aggregate.clicks / aggregate.impressions
                    : 0,
              }
            : null,
        };
      }),
    };
  });

const snapshotPointSchema = type({
  snapshotId: "string.uuid",
  takenAt: "Date",
  aggregate: type({
    "...": snapshotAggregateSchema,
    ctr: "number",
  }),
});
const getDraftDetails = withOrganizationIdBase
  .route({ method: "GET", path: "/draft/{id}/details" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      "months?": "1<=number<=12",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      contentDraft: schema.seoContentDraftSelectSchema,
      metricSnapshot: type({
        "...": schema.seoStrategySnapshotContentSelectSchema.pick(
          "id",
          "topKeywords",
          "aggregate",
        ),
        snapshot: schema.seoStrategySnapshotSelectSchema.pick("id", "takenAt"),
      }).or(type.null),
      primaryKeywordOverview: contentKeywordSchema.or(type.null),
      series: snapshotPointSchema.array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const contentResult = await getContentDraftWithLatestMetricSnapshot({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      contentDraftId: input.id,
      withContent: true,
    });
    if (!contentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content details.",
        cause: contentResult.error,
      });
    }
    if (!contentResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Content draft not found." });
    }

    const draft = contentResult.value;
    const contentSeriesResult = draft.strategyId
      ? await listContentSnapshotInRange({
          db: context.db,
          strategyId: draft.strategyId,
          contentDraftId: input.id,
          months: input.months ?? 3,
        })
      : { ok: true as const, value: [] };
    if (!contentSeriesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load content snapshot series.",
        cause: contentSeriesResult.error,
      });
    }

    const primaryKeyword = draft.primaryKeyword.trim();
    const primaryKeywordOverview = primaryKeyword
      ? await (async () => {
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
          const { locationName, languageCode } =
            getLocationAndLanguage(project);
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
          return keywordOverviewResult.value.keywords[0] ?? null;
        })()
      : null;

    const metricSnapshot = draft.metricSnapshots[0] ?? null;
    return {
      contentDraft: draft,
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

const updateDraft = withOrganizationIdBase
  .route({ method: "PATCH", path: "/draft/{id}" })
  .input(
    schema.seoContentDraftUpdateSchema.merge(
      type({ organizationIdentifier: "string" }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ draft: contentDraftSummarySchema }))
  .handler(async ({ context, input }) => {
    const writeResult = await writeContentDraft({
      db: context.db,
      chatId: null,
      userId: context.user.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
      lookup: { type: "id", id: input.id },
      draftNewValues: input,
    });
    if (!writeResult.ok) {
      if (writeResult.error.message === DRAFT_NOT_FOUND_ERROR_MESSAGE) {
        throw new ORPCError("NOT_FOUND", {
          message: writeResult.error.message,
        });
      }
      if (writeResult.error.message === SLUG_NOT_AVAILABLE_ERROR_MESSAGE) {
        throw new ORPCError("BAD_REQUEST", {
          message: writeResult.error.message,
        });
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update content draft.",
        cause: writeResult.error,
      });
    }

    const {
      contentMarkdown: _contentMarkdown,
      outline: _outline,
      ...draft
    } = writeResult.value.draft;
    return { draft };
  });

const markDraft = withOrganizationIdBase
  .route({ method: "POST", path: "/draft/{id}/mark" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      mark: "'yes'|'no'",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      draft: contentDraftSummarySchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const draftResult = await getDraftById({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      id: input.id,
      withContent: true,
    });
    if (!draftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get content draft.",
        cause: draftResult.error,
      });
    }
    if (!draftResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Content draft not found." });
    }
    const draft = draftResult.value;
    const isSuggestion = draft.status === "suggested";

    if (input.mark === "no") {
      const status = isSuggestion ? "suggestion-rejected" : "review-denied";
      const updatedResult = await updateContentDraft(context.db, {
        id: draft.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        status,
      });
      if (!updatedResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to mark content draft.",
          cause: updatedResult.error,
        });
      }
      const {
        contentMarkdown: _contentMarkdown,
        outline: _outline,
        ...summary
      } = updatedResult.value;
      return { draft: summary };
    }

    if (isSuggestion) {
      const updatedResult = await writeContentDraft({
        db: context.db,
        chatId: null,
        userId: context.user.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        lookup: { type: "id", id: input.id },
        draftNewValues: { status: "queued" },
      });
      if (!updatedResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to approve suggestion.",
          cause: updatedResult.error,
        });
      }

      const {
        contentMarkdown: _contentMarkdown,
        outline: _outline,
        ...summary
      } = updatedResult.value.draft;
      return { draft: summary };
    }

    const updatedDraftResult = await writeContentDraft({
      db: context.db,
      chatId: null,
      userId: context.user.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
      lookup: { type: "id", id: input.id },
      draftNewValues: { status: "scheduled" },
    });
    if (!updatedDraftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update draft.",
        cause: updatedDraftResult.error,
      });
    }
    const updatedDraft = updatedDraftResult.value.draft;

    const {
      contentMarkdown: _contentMarkdown,
      outline: _outline,
      ...summary
    } = updatedDraft;
    return {
      draft: summary,
    };
  });

const publishContent = base
  .route({ method: "POST", path: "/draft/{id}/publish" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      payload: type({
        draftId: "string.uuid",
        signature: "string",
      }),
    }),
  )
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    // todo use timing safe comparison
    if (input.payload.signature !== createSignature(input.payload.draftId)) {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid signature." });
    }

    if (input.payload.draftId !== input.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft ID does not match route ID.",
      });
    }

    const draftResult = await getDraftById({
      db: context.db,
      organizationId: input.organizationIdentifier,
      projectId: input.projectId,
      id: input.id,
      withContent: true,
    });
    if (!draftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get content draft.",
        cause: draftResult.error,
      });
    }
    if (!draftResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Content draft not found." });
    }

    const draft = draftResult.value;
    if (draft.status !== "scheduled") {
      console.warn("[publishContent] draft is not scheduled", {
        draftId: draft.id,
        organizationId: draft.organizationId,
        projectId: draft.projectId,
        scheduledFor: draft.scheduledFor,
        status: draft.status,
      });
      return { success: true } as const;
    }
    if (!draft.scheduledFor) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft is missing scheduled publish time.",
      });
    }

    const now = new Date();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (now.getTime() < draft.scheduledFor.getTime() - fiveMinutesMs) {
      // too early to publish, schedule a task to publish later
      const publishWebhookUrl = new URL(
        `/api/organization/${draft.organizationId}/project/${draft.projectId}/content/draft/${draft.id}/publish`,
        context.url.origin,
      ).toString();

      await context.scheduler.scheduleTask({
        id: draft.id,
        description: `publish-draft:${draft.id}`,
        type: "scheduled",
        time: draft.scheduledFor,
        payload: {
          draftId: draft.id,
          signature: createSignature(draft.id),
        },
        callback: {
          type: "webhook",
          url: publishWebhookUrl,
        },
      });

      return { success: true } as const;
    }

    console.info("[publishContent] publishing", {
      draftId: draft.id,
      organizationId: draft.organizationId,
      projectId: draft.projectId,
      scheduledFor: draft.scheduledFor,
      now,
    });

    // Get next version number for this slug
    const nextVersionResult = await getNextVersionForSlug({
      db: context.db,
      organizationId: draft.organizationId,
      projectId: input.projectId,
      slug: draft.slug,
    });
    if (!nextVersionResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get next version number.",
        cause: nextVersionResult.error,
      });
    }
    const nextVersion = nextVersionResult.value;

    if (!draft.articleType || !draft.contentMarkdown) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft is missing articleType or contentMarkdown.",
      });
    }

    const createdContentResult = await createContent(context.db, {
      organizationId: draft.organizationId,
      projectId: draft.projectId,
      originatingDraftId: draft.id,
      slug: draft.slug,
      version: nextVersion,
      title: draft.title ?? "",
      description: draft.description ?? "",
      primaryKeyword: draft.primaryKeyword,
      articleType: draft.articleType,
      contentMarkdown: draft.contentMarkdown,
      publishedAt: draft.scheduledFor,
    });
    if (!createdContentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create published content.",
        cause: createdContentResult.error,
      });
    }
    const createdContent = createdContentResult.value;

    const publishResult = await publishToIntegrations({
      db: context.db,
      content: createdContent,
      projectId: draft.projectId,
      organizationId: draft.organizationId,
    });
    if (!publishResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to publish content to integrations.",
        cause: publishResult.error,
      });
    }

    const updatedDraftResult = await updateContentDraft(context.db, {
      id: draft.id,
      projectId: draft.projectId,
      organizationId: draft.organizationId,
      status: "published",
    });
    if (!updatedDraftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update draft after publishing.",
        cause: updatedDraftResult.error,
      });
    }

    return { success: true } as const;
  });

const exportByDraftIds = withOrganizationIdBase
  .route({ method: "POST", path: "/export/selected" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      draftIds: "1<=string.uuid[]<=200",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: schema.seoContentDraftSelectSchema.omit("outline", "notes").array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listDraftsForExportByIds({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      draftIds: input.draftIds,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load selected content for export.",
        cause: rowsResult.error,
      });
    }

    return { data: rowsResult.value };
  });

export default base
  .prefix("/organization/{organizationIdentifier}/project/{projectId}/content")
  .router({
    list,
    getDraftDetails,
    updateDraft,
    markDraft,
    publishContent,
    exportByDraftIds,
  });
