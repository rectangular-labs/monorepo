import { ORPCError } from "@orpc/server";
import { eq, schema } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { createTask } from "../lib/task";

const triggerOnboardingTask = protectedBase
  .route({ method: "POST", path: "/trigger-onboarding-task" })
  .input(type({ organizationSlug: "string", projectSlug: "string" }))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: context.user.id,
      input: {
        type: "seo-understand-site",
        projectId: projectResult.id,
      },
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    await updateSeoProject(db, {
      id: projectResult.id,
      organizationId: projectResult.organizationId,
      projectResearchWorkflowId: createTaskResult.value.id,
    });

    return {
      projectId: projectResult.id,
      organizationId: projectResult.organizationId,
      taskId: createTaskResult.value.id,
    };
  });

const triggerStrategySuggestionsTask = protectedBase
  .route({ method: "POST", path: "/trigger-strategy-suggestions-task" })
  .input(
    type({
      organizationSlug: "string",
      projectSlug: "string",
      instructions: "string",
    }),
  )
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: context.user.id,
      input: {
        type: "seo-generate-strategy-suggestions",
        projectId: projectResult.id,
        instructions: input.instructions,
      },
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    return {
      projectId: projectResult.id,
      organizationId: projectResult.organizationId,
      taskId: createTaskResult.value.id,
    };
  });

const triggerStrategyPhaseGenerationTask = protectedBase
  .route({ method: "POST", path: "/trigger-strategy-phase-generation-task" })
  .input(
    type({
      organizationSlug: "string",
      projectSlug: "string",
      strategyName: "string",
    }),
  )
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      strategyId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("@fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;

    const organizationResult = await db.query.organization.findFirst({
      where: eq(schema.organization.slug, input.organizationSlug),
    });

    if (!organizationResult) {
      throw new ORPCError("NOT_FOUND", { message: "Organization not found" });
    }

    const projectResult = await db.query.seoProject.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.slug, input.projectSlug),
        ),
    });

    if (!projectResult) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }

    const strategyResults = await db.query.seoStrategy.findMany({
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.organizationId, organizationResult.id),
          eq(table.projectId, projectResult.id),
          eq(table.name, input.strategyName),
          isNull(table.deletedAt),
        ),
      limit: 2,
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
    });

    if (strategyResults.length === 0) {
      throw new ORPCError("NOT_FOUND", { message: "Strategy not found" });
    }

    if (strategyResults.length > 1) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Multiple strategies found with that name. Please rename the strategy and try again.",
      });
    }

    const strategy = strategyResults[0];
    if (!strategy) {
      throw new ORPCError("NOT_FOUND", { message: "Strategy not found" });
    }

    const createTaskResult = await createTask({
      db,
      userId: undefined,
      input: {
        type: "seo-generate-strategy-phase",
        projectId: projectResult.id,
        organizationId: organizationResult.id,
        strategyId: strategy.id,
        userId: undefined,
      },
      workflowInstanceId: `strategy_phase_generation_${strategy.id}_${crypto.randomUUID().slice(0, 6)}`,
    });

    if (!createTaskResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createTaskResult.error.message,
      });
    }

    return {
      projectId: projectResult.id,
      organizationId: organizationResult.id,
      strategyId: strategy.id,
      taskId: createTaskResult.value.id,
    };
  });

export default protectedBase.prefix("/admin").router({
  triggerOnboardingTask,
  triggerStrategySuggestionsTask,
  triggerStrategyPhaseGenerationTask,
});
