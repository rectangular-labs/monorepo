import { ORPCError } from "@orpc/server";
import type { taskInputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { type DB, schema } from "@rectangular-labs/db";
import { err, ok, type Result, safe } from "@rectangular-labs/result";
import { triggerTask } from "@rectangular-labs/task/client";
import type { type } from "arktype";
import { createWorkflows } from "../workflows";

type TaskInput = type.infer<typeof taskInputSchema>;
type SeoWriteArticleTaskInput = Extract<
  TaskInput,
  { type: "seo-write-article" }
>;
type SeoTaskRun = typeof schema.seoTaskRun.$inferSelect;

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
      case "seo-understand-site": {
        const instance = await workflows.seoOnboardingWorkflow.create({
          id: workflowInstanceId ?? `onboarding_${crypto.randomUUID()}`,
          params: input,
        });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-generate-strategy-suggestions": {
        const instance = await workflows.seoStrategySuggestionsWorkflow.create({
          id: workflowInstanceId ?? `strategy_${crypto.randomUUID()}`,
          params: input,
        });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-generate-strategy-phase": {
        const instance =
          await workflows.seoStrategyPhaseGenerationWorkflow.create({
            id:
              workflowInstanceId ??
              `strategy_phase_generation_${crypto.randomUUID()}`,
            params: input,
          });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-plan-keyword": {
        const instance = await workflows.seoPlannerWorkflow.create({
          id: workflowInstanceId ?? `plan_${crypto.randomUUID()}`,
          params: input,
        });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-write-article": {
        const instance = await workflows.seoWriterWorkflow.create({
          id: workflowInstanceId ?? `write_${crypto.randomUUID()}`,
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

export async function createSeoWriteArticleTasksBatch({
  db,
  userId,
  tasks,
}: {
  db: DB;
  userId: string | undefined;
  tasks: {
    input: SeoWriteArticleTaskInput;
    workflowInstanceId?: string;
  }[];
}): Promise<Result<SeoTaskRun[], Error>> {
  if (tasks.length === 0) {
    return ok([] as SeoTaskRun[]);
  }

  const workflows = createWorkflows();
  const allTaskRuns: SeoTaskRun[] = [];

  for (let index = 0; index < tasks.length; index += 100) {
    const taskBatch = tasks.slice(index, index + 100);

    const instancesResult = await safe(() =>
      workflows.seoWriterWorkflow.createBatch(
        taskBatch.map((task) => ({
          id: task.workflowInstanceId ?? `write_${crypto.randomUUID()}`,
          params: task.input,
        })),
      ),
    );
    if (!instancesResult.ok) {
      return instancesResult;
    }

    const taskRunsResult = await safe(() =>
      db
        .insert(schema.seoTaskRun)
        .values(
          instancesResult.value.map((instance, taskIndex) => {
            const task = taskBatch[taskIndex];
            if (!task) {
              throw new Error(
                "Writer task batch is out of sync with instances",
              );
            }
            return {
              projectId: task.input.projectId,
              requestedBy: userId,
              taskId: instance.id,
              provider: "cloudflare" as const,
              inputData: task.input,
            };
          }),
        )
        .returning(),
    );
    if (!taskRunsResult.ok) {
      return taskRunsResult;
    }

    allTaskRuns.push(...taskRunsResult.value);
  }

  return ok(allTaskRuns);
}
