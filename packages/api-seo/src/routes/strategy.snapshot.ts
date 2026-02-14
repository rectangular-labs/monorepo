import { ORPCError } from "@orpc/server";
import {
  keywordSnapshotSchema,
  snapshotAggregateSchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import {
  aggregateLatestSnapshotKeywords,
  listStrategySnapshotsInRange,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
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
    keywords: {
      list: keywordsList,
    },
  });
