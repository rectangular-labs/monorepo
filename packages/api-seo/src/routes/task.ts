"use server";
import { ORPCError } from "@orpc/server";
import {
  taskInputSchema,
  taskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { getTask } from "@rectangular-labs/task/client";
import { type } from "arktype";
import { protectedBase, withOrganizationIdBase } from "../context";
import { createTask } from "../lib/task";

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(taskInputSchema)
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input: taskInput }) => {
    const createTaskResult = await createTask({
      db: context.db,
      userId: context.user.id,
      input: taskInput,
    });
    if (!createTaskResult.ok) {
      throw createTaskResult.error;
    }
    return {
      projectId: taskInput.projectId,
      organizationId: context.session.activeOrganizationId,
      taskId: createTaskResult.value.id,
    };
  });

const outputSchema = type({
  progress: "0 <= number <= 100",
  status:
    "'pending' | 'queued' | 'running' | 'completed' | 'cancelled' | 'failed'",
  statusMessage: "string",
  output: taskOutputSchema.or(type.null),
});

const status = protectedBase
  .route({
    method: "GET",
    path: "/{id}",
  })
  .input(type({ id: "string" }))
  .output(outputSchema)
  .handler(async ({ context, input }) => {
    const taskRun = await context.db.query.seoTaskRun.findFirst({
      where: (table, { eq }) => eq(table.id, input.id),
    });
    if (!taskRun) {
      throw new ORPCError("NOT_FOUND", {
        message: "Task run not found",
      });
    }

    let status: (typeof outputSchema.infer)["status"] = "pending";
    let progress = 0;
    let statusMessage = "We are setting things up...";

    if (taskRun.provider === "trigger.dev") {
      const task = await getTask(taskRun.taskId);
      if (!task) {
        throw new ORPCError("NOT_FOUND", {
          message: "Task not found",
        });
      }

      if (task.isQueued) status = "queued";
      if (task.isExecuting) status = "running";
      if (task.isSuccess) status = "completed";
      if (task.isCancelled) status = "cancelled";
      if (task.isFailed) status = "failed";

      if (task.metadata?.progress) {
        progress = task.metadata.progress;
      }
      if (task.metadata?.statusMessage) {
        statusMessage = task.metadata.statusMessage;
      }

      return {
        progress,
        status,
        statusMessage,
        output: task.output ?? null,
      };
    }

    if (taskRun.provider === "cloudflare") {
      const instance = await (() => {
        if (taskRun.inputData.type === "seo-plan-keyword") {
          return context.seoPlannerWorkflow.get(taskRun.taskId);
        }
        if (taskRun.inputData.type === "seo-write-article") {
          return context.seoWriterWorkflow.get(taskRun.taskId);
        }
        if (taskRun.inputData.type === "seo-understand-site") {
          return context.seoOnboardingWorkflow.get(taskRun.taskId);
        }
        return null;
      })();

      if (!instance) {
        throw new ORPCError("NOT_FOUND", { message: "Workflow not found" });
      }

      const details = await instance.status();
      console.log("details", details);
      switch (details.status) {
        case "queued": {
          status = "queued";
          break;
        }
        case "running":
        case "waiting":
        case "waitingForPause":
        case "paused": {
          status = "running";
          break;
        }
        case "complete": {
          status = "completed";
          break;
        }
        case "terminated": {
          status = "cancelled";
          break;
        }
        case "errored": {
          status = "failed";
          statusMessage = details.error ?? "Workflow errored";
          break;
        }
        case "unknown": {
          status = "pending";
          break;
        }
        default: {
          const never: never = details.status;
          throw new Error(`Unknown workflow status: ${never}`);
        }
      }

      const output = taskOutputSchema(details.output);

      return {
        progress,
        status,
        statusMessage,
        output: output instanceof type.errors ? null : output,
      };
    }

    return { progress, status, statusMessage, output: null };
  });

export default protectedBase
  .prefix("/task")
  .router({ create, getStatus: status });
