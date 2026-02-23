import { ORPCError } from "@orpc/server";
import { eq, schema } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { createTask } from "../lib/task";

const triggerOnboardingTask = protectedBase
  .route({ method: "POST", path: "/trigger-onboarding-task" })
  .input(type({ projectSlug: "string" }))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const projectResult = await db.query.seoProject.findFirst({
      where: eq(schema.seoProject.slug, input.projectSlug),
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
  .input(type({ projectSlug: "string", instructions: "string" }))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    if (!context.user.email?.endsWith("fluidposts.com")) {
      throw new ORPCError("FORBIDDEN", { message: "Not authorized" });
    }

    const db = context.db;
    const projectResult = await db.query.seoProject.findFirst({
      where: eq(schema.seoProject.slug, input.projectSlug),
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

export default protectedBase.prefix("/admin").router({
  triggerOnboardingTask,
  triggerStrategySuggestionsTask,
});
