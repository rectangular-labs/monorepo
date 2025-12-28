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
  .input(taskInputSchema.merge(type({ projectId: "string" })))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input: taskInput }) => {
    const createTaskResult = await createTask({
      projectId: taskInput.projectId,
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
  "output?": taskOutputSchema.or(type.undefined),
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
    const task = await getTask(taskRun.taskId);
    if (!task) {
      throw new ORPCError("NOT_FOUND", {
        message: "Task not found",
      });
    }

    console.log("task", task);
    let status: (typeof outputSchema.infer)["status"] = "pending";
    if (task.isQueued) {
      status = "queued";
    }
    if (task.isExecuting) {
      status = "running";
    }
    if (task.isSuccess) {
      status = "completed";
    }
    if (task.isCancelled) {
      status = "cancelled";
    }
    if (task.isFailed) {
      status = "failed";
    }
    let progress = 0;
    if (task.metadata?.progress) {
      progress = task.metadata.progress;
    }
    let statusMessage = "We are setting things up...";
    if (task.metadata?.statusMessage) {
      statusMessage = task.metadata.statusMessage;
    }
    console.log("task.output", task.output);
    return {
      progress,
      status,
      statusMessage,
      output: task.output,
    };
  });

export default protectedBase
  .prefix("/task")
  .router({ create, getStatus: status });
