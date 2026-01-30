import { ORPCError } from "@orpc/server";
import { schema } from "@rectangular-labs/db";
import {
  createContentDraft,
  createStrategy,
  createStrategyPhase,
  createStrategyPhaseContent,
  getStrategyDetails,
  listStrategiesByProjectId,
  updateStrategyPhase,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";

const contentDraftInputSchema = schema.seoContentDraftInsertSchema.omit(
  "organizationId",
  "projectId",
  "strategyId",
);

const phaseContentInputSchema = type({
  action: "'create'|'improve'|'expand'",
  "contentDraftId?": "string.uuid|undefined",
  "contentDraft?": contentDraftInputSchema.or(type.undefined),
  "plannedTitle?": "string|undefined",
  "plannedPrimaryKeyword?": "string|undefined",
  "role?": "'pillar'|'supporting'|undefined",
  "notes?": "string|undefined",
});

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
      data: type({
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

    const data = strategiesResult.value.map((strategy) => {
      const phases = strategy.phases ?? [];
      const currentPhase =
        phases.find((phase) => phase.status === "in_progress") ??
        phases.find((phase) => phase.status === "planned") ??
        phases.find((phase) => phase.status === "observing") ??
        phases.at(0) ??
        null;
      return {
        ...strategy,
        currentPhase,
      };
    });

    return { data };
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

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      strategy: schema.seoStrategyInsertSchema.omit("projectId"),
      phase: schema.seoStrategyPhaseInsertSchema.omit("strategyId"),
      "contents?": phaseContentInputSchema.array(),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      message: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    const contents = input.contents ?? [];
    const strategyId = await context.db.transaction(async (tx) => {
      const strategyResult = await createStrategy(tx, {
        ...input.strategy,
        projectId: input.projectId,
      });
      if (!strategyResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create strategy.",
          cause: strategyResult.error,
        });
      }

      const phaseResult = await createStrategyPhase(tx, {
        ...input.phase,
        strategyId: strategyResult.value.id,
      });
      if (!phaseResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to create strategy phase.",
          cause: phaseResult.error,
        });
      }

      for (const content of contents) {
        let contentDraftId = content.contentDraftId;
        if (!contentDraftId && content.contentDraft) {
          const draftResult = await createContentDraft(tx, {
            ...content.contentDraft,
            organizationId: context.organization.id,
            projectId: input.projectId,
            strategyId: strategyResult.value.id,
          });
          if (!draftResult.ok) {
            throw new ORPCError("INTERNAL_SERVER_ERROR", {
              message: "Failed to create content draft.",
              cause: draftResult.error,
            });
          }
          contentDraftId = draftResult.value.id;
        }

        const phaseContentResult = await createStrategyPhaseContent(tx, {
          phaseId: phaseResult.value.id,
          contentDraftId,
          action: content.action,
          plannedTitle: content.plannedTitle ?? content.contentDraft?.title,
          plannedPrimaryKeyword:
            content.plannedPrimaryKeyword ??
            content.contentDraft?.primaryKeyword,
          role: content.role,
          notes: content.notes,
        });
        if (!phaseContentResult.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to create strategy phase content.",
            cause: phaseContentResult.error,
          });
        }
      }

      return strategyResult.value.id;
    });

    const strategyResult = await getStrategyDetails({
      db: context.db,
      projectId: input.projectId,
      strategyId,
    });
    if (!strategyResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load strategy.",
        cause: strategyResult.error,
      });
    }
    if (!strategyResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No strategy found after creation.",
      });
    }
    return strategyResult.value;
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
    create,
    phases: {
      create: createPhase,
      update: updatePhase,
    },
  });
