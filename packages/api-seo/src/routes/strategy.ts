import { ORPCError } from "@orpc/server";
import { schema } from "@rectangular-labs/db";
import {
  createStrategies,
  createStrategyPhase,
  getSeoProjectByIdentifierAndOrgId,
  getStrategy,
  getStrategyDetails,
  listStrategiesByProjectId,
  updateStrategy,
  updateStrategyPhase,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";
import { createTask } from "../lib/task";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      strategies: type({
        "...": schema.seoStrategySelectSchema,
        phases: schema.seoStrategyPhaseSelectSchema.array(),
        snapshots: schema.seoStrategySnapshotSelectSchema
          .pick("aggregate")
          .array(),
      }).array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const strategiesResult = await listStrategiesByProjectId({
      db: context.db,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!strategiesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategies.",
        cause: strategiesResult.error,
      });
    }

    return { strategies: strategiesResult.value };
  });

const get = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      "...": schema.seoStrategySelectSchema,
      phases: type({
        "...": schema.seoStrategyPhaseSelectSchema,
        phaseContents: type({
          "...": schema.seoStrategyPhaseContentSelectSchema,
          contentDraft: schema.seoContentDraftSelectSchema
            .omit("contentMarkdown", "outline")
            .or(type.null),
        }).array(),
      }).array(),
      snapshots: type({
        "...": schema.seoStrategySnapshotSelectSchema,
        contentSnapshots: type({
          "...": schema.seoStrategySnapshotContentSelectSchema,
          contentDraft: schema.seoContentDraftSelectSchema
            .pick("id", "title", "slug", "primaryKeyword")
            .or(type.null),
        }).array(),
      }).array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const strategyResult = await getStrategyDetails({
      db: context.db,
      projectId: input.projectId,
      strategyId: input.id,
      organizationId: context.organization.id,
    });
    if (!strategyResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy.",
        cause: strategyResult.error,
      });
    }
    if (!strategyResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No strategy found.",
      });
    }
    return strategyResult.value;
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      "...": schema.seoStrategyUpdateSchema.omit("organizationId"),
      organizationIdentifier: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoStrategySelectSchema)
  .handler(async ({ context, input }) => {
    const existingStrategyResult = await getStrategy({
      db: context.db,
      projectId: input.projectId,
      strategyId: input.id,
      organizationId: context.organization.id,
    });

    if (!existingStrategyResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Something went wrong updating strategy",
        cause: existingStrategyResult.error,
      });
    }
    const existingStrategy = existingStrategyResult.value;

    const updateResult = await updateStrategy(context.db, {
      ...input,
      organizationId: context.organization.id,
    });
    if (!updateResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update strategy.",
        cause: updateResult.error,
      });
    }

    if (input.status === "active" && existingStrategy?.status !== "active") {
      const taskResult = await createTask({
        db: context.db,
        userId: context.user?.id,
        input: {
          type: "seo-generate-strategy-phase",
          projectId: input.projectId,
          organizationId: context.organization.id,
          strategyId: updateResult.value.id,
          userId: context.user.id,
        },
        workflowInstanceId: `strategy_phase_generation_${updateResult.value.id}_${crypto.randomUUID().slice(0, 6)}`,
      });

      if (!taskResult.ok) {
        console.error(
          "Failed to trigger strategy phase generation workflow",
          taskResult.error,
        );
      }
    }

    return updateResult.value;
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      "...": schema.seoStrategyInsertSchema,
      organizationIdentifier: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoStrategySelectSchema)
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.projectId,
      context.organization.id,
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Something went wrong retrieving project",
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "Invalid project ID",
      });
    }
    const createResult = await createStrategies(context.db, [
      {
        projectId: input.projectId,
        organizationId: context.organization.id,
        name: input.name,
        motivation: input.motivation,
        description: input.description ?? null,
        goal: input.goal,
        status: "active",
      },
    ]);
    if (!createResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create strategy.",
        cause: createResult.error,
      });
    }
    const createdStrategy = createResult.value[0];
    if (!createdStrategy) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "BAD STATE: Missing created strategy",
      });
    }
    const taskResult = await createTask({
      db: context.db,
      userId: context.user?.id,
      input: {
        type: "seo-generate-strategy-phase",
        projectId: input.projectId,
        organizationId: context.organization.id,
        strategyId: createdStrategy.id,
        userId: context.user.id,
      },
      workflowInstanceId: `strategy_phase_generation_${createdStrategy.id}_${crypto.randomUUID().slice(0, 6)}`,
    });

    if (!taskResult.ok) {
      console.error(
        "Failed to trigger strategy phase generation workflow",
        taskResult.error,
      );
    }
    return createdStrategy;
  });

const createPhase = withOrganizationIdBase
  .route({ method: "POST", path: "/{strategyId}/phases" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategyId: "string.uuid",
      phase: schema.seoStrategyPhaseInsertSchema.omit("strategyId"),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoStrategyPhaseSelectSchema)
  .handler(async ({ context, input }) => {
    const strategyResult = await getStrategy({
      db: context.db,
      projectId: input.projectId,
      strategyId: input.strategyId,
      organizationId: context.organization.id,
    });
    if (!strategyResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy.",
        cause: strategyResult.error,
      });
    }
    if (!strategyResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No strategy found.",
      });
    }

    const phaseResult = await createStrategyPhase(context.db, {
      ...input.phase,
      strategyId: input.strategyId,
    });
    if (!phaseResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create phase.",
        cause: phaseResult.error,
      });
    }
    return phaseResult.value;
  });

const updatePhase = withOrganizationIdBase
  .route({ method: "PATCH", path: "/phases/{id}" })
  .input(
    schema.seoStrategyPhaseUpdateSchema.merge(
      type({
        organizationIdentifier: "string",
        projectId: "string.uuid",
      }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoStrategyPhaseSelectSchema)
  .handler(async ({ context, input }) => {
    const strategyResult = await getStrategy({
      db: context.db,
      projectId: input.projectId,
      strategyId: input.strategyId,
      organizationId: context.organization.id,
    });
    if (!strategyResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy.",
        cause: strategyResult.error,
      });
    }
    if (!strategyResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No strategy found.",
      });
    }

    const updateResult = await updateStrategyPhase(context.db, input);
    if (!updateResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update phase.",
        cause: updateResult.error,
      });
    }
    return updateResult.value;
  });

export default base
  .prefix("/organization/{organizationIdentifier}/project/{projectId}/strategy")
  .router({
    list,
    get,
    create,
    update,
    phases: {
      create: createPhase,
      update: updatePhase,
    },
  });
