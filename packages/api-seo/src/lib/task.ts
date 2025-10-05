import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import type { taskInputSchema } from "@rectangular-labs/db/parsers";
import { err, ok, safe } from "@rectangular-labs/result";
import { triggerTask } from "@rectangular-labs/task/client";
import type { type } from "arktype";
import { getContext } from "../context";

export async function createTask({
  projectId,
  userId,
  input,
}: {
  projectId: string;
  userId: string;
  input: type.infer<typeof taskInputSchema>;
}) {
  const context = await safe(() => getContext());
  if (!context.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error getting context",
      }),
    );
  }

  const taskTriggerResult = await safe(() => triggerTask(input));
  if (!taskTriggerResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task",
      }),
    );
  }

  const taskRunInsertResult = await safe(() =>
    context.value.db
      .insert(schema.seoTaskRun)
      .values({
        projectId,
        requestedBy: userId,
        taskId: taskTriggerResult.value.id,
        provider: "trigger.dev",
        inputData: input,
      })
      .returning(),
  );
  if (!taskRunInsertResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task run",
      }),
    );
  }
  const taskRun = taskRunInsertResult.value[0];
  if (!taskRun) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task run",
      }),
    );
  }
  return ok(taskRun);
}
