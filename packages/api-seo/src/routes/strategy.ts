import { ORPCError } from "@orpc/server";
import { schema } from "@rectangular-labs/db";
import {
  createStrategyPhase,
  getStrategyDetails,
  listStrategiesByProjectId,
  updateStrategy,
  updateStrategyPhase,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";

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
      }).array(),
    }),
  )
  .handler(async ({ context, input }) => {
    const strategiesResult = await listStrategiesByProjectId({
      db: context.db,
      projectId: input.projectId,
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
            .omit("contentMarkdown", "outline", "notes")
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
      "...": schema.seoStrategyUpdateSchema,
      organizationIdentifier: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoStrategySelectSchema)
  .handler(async ({ context, input }) => {
    const updateResult = await updateStrategy(context.db, input);
    if (!updateResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update strategy.",
        cause: updateResult.error,
      });
    }
    return updateResult.value;
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
    update,
    phases: {
      create: createPhase,
      update: updatePhase,
    },
  });
