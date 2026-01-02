import { ORPCError } from "@orpc/server";
import type { taskInputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { type DB, schema } from "@rectangular-labs/db";
import { err, ok, safe } from "@rectangular-labs/result";
import { triggerTask } from "@rectangular-labs/task/client";
import type { type } from "arktype";
import { createWorkflows } from "../workflows";

type TaskInput = type.infer<typeof taskInputSchema>;

export async function createTask({
  db,
  userId,
  input,
  workflowInstanceId,
}: {
  db: DB;
  input: TaskInput;
  userId: string | undefined;
  /**
   * Optional instance ID used when triggering a Cloudflare Workflow.
   * When provided, it will be used as the Workflow instance id.
   */
  workflowInstanceId?: string;
}) {
  const workflows = createWorkflows();

  const taskIdResult = await safe(async () => {
    switch (input.type) {
      case "understand-site": {
        const { id } = await triggerTask(input);
        return { provider: "trigger.dev" as const, taskId: id };
      }
      case "seo-plan-keyword": {
        const instance = await workflows.seoPlannerWorkflow.create({
          id: workflowInstanceId,
          params: input,
        });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-write-article": {
        const instance = await workflows.seoWriterWorkflow.create({
          id: workflowInstanceId,
          params: input,
        });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      default: {
        const never: never = input;
        throw new Error(`Unknown task type: ${(never as TaskInput).type}`);
      }
    }
  });
  if (!taskIdResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task",
        cause: taskIdResult.error,
      }),
    );
  }

  const taskRunInsertResult = await safe(() =>
    db
      .insert(schema.seoTaskRun)
      .values({
        projectId: input.projectId,
        requestedBy: userId,
        taskId: taskIdResult.value.taskId,
        provider: taskIdResult.value.provider,
        inputData: input,
      })
      .returning(),
  );
  if (!taskRunInsertResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task run",
        cause: taskRunInsertResult.error,
      }),
    );
  }
  const taskRun = taskRunInsertResult.value[0];
  if (!taskRun) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "No Task run was created",
        cause: new Error("Task run insert returned no rows"),
      }),
    );
  }
  return ok(taskRun);
}
