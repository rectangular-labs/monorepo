import { ORPCError } from "@orpc/server";
import type { ArticleType } from "@rectangular-labs/core/schemas/content-parsers";
import type { taskInputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { type DB, schema } from "@rectangular-labs/db";
import {
  addChatContribution,
  addUserContribution,
  getDraftById,
  updateContentDraft,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result, safe } from "@rectangular-labs/result";
import { triggerTask } from "@rectangular-labs/task/client";
import type { type } from "arktype";
import { createWorkflows } from "../workflows";
import { ensureDraftForSlug } from "./content/ensure-draft-for-slug";
import { normalizeContentSlug } from "./content/normalize-content-slug";

type TaskInput = type.infer<typeof taskInputSchema>;
type SeoWriteArticleTaskInput = Extract<
  TaskInput,
  { type: "seo-write-article" }
>;
type SeoTaskRun = typeof schema.seoTaskRun.$inferSelect;

type QueueDraftMetadata = Partial<{
  title: string;
  notes: string;
  strategyId: string | null;
  role: "pillar" | "supporting" | null;
  articleType: ArticleType | null;
}>;

type QueueArticleWriteResult =
  | {
      status: "queued";
      draft: typeof schema.seoContentDraft.$inferSelect;
    }
  | {
      status: "in_progress";
      draft: typeof schema.seoContentDraft.$inferSelect;
    }
  | {
      status: "confirmation_required";
      draft: typeof schema.seoContentDraft.$inferSelect;
    };

const IN_PROGRESS_DRAFT_STATUSES = new Set([
  "queued",
  "planning",
  "writing",
  "reviewing-writing",
]);
const IN_PROGRESS_WORKFLOW_STATUSES = new Set([
  "queued",
  "running",
  "waiting",
  "waitingForPause",
  "paused",
]);

function buildDraftMetadataUpdates(
  metadata: QueueDraftMetadata,
): QueueDraftMetadata {
  const updates: QueueDraftMetadata = {};

  if (metadata.title !== undefined) {
    updates.title = metadata.title;
  }
  if (metadata.notes !== undefined) {
    updates.notes = metadata.notes;
  }
  if (metadata.strategyId !== undefined) {
    updates.strategyId = metadata.strategyId;
  }
  if (metadata.role !== undefined) {
    updates.role = metadata.role;
  }
  if (metadata.articleType !== undefined) {
    updates.articleType = metadata.articleType;
  }

  return updates;
}

async function isWriterTaskLiveInProgress(args: {
  db: DB;
  draft: typeof schema.seoContentDraft.$inferSelect;
}) {
  const taskRunId = args.draft.generatedByTaskRunId;
  if (!taskRunId) {
    return ok(false);
  }

  const taskRunResult = await safe(() =>
    args.db.query.seoTaskRun.findFirst({
      where: (table, { eq }) => eq(table.id, taskRunId),
    }),
  );
  if (!taskRunResult.ok) {
    return taskRunResult;
  }

  const taskRun = taskRunResult.value;
  if (!taskRun || taskRun.provider !== "cloudflare") {
    return ok(false);
  }
  if (taskRun.inputData.type !== "seo-write-article") {
    return ok(false);
  }

  const workflows = createWorkflows();
  const statusResult = await safe(async () => {
    const instance = await workflows.seoWriterWorkflow.get(taskRun.taskId);
    return await instance.status();
  });
  if (!statusResult.ok) {
    return statusResult;
  }

  return ok(IN_PROGRESS_WORKFLOW_STATUSES.has(statusResult.value.status));
}

export async function queueSeoWriteArticleTask(args: {
  db: DB;
  projectId: string;
  organizationId: string;
  userId?: string;
  chatId?: string | null;
  confirmOverwrite?: boolean;
  target:
    | {
        draftId: string;
      }
    | {
        slug: string;
        primaryKeyword: string;
      };
  metadata?: QueueDraftMetadata;
}): Promise<Result<QueueArticleWriteResult, Error>> {
  const metadataUpdates = buildDraftMetadataUpdates(args.metadata ?? {});
  const isExplicitDraftTarget = "draftId" in args.target;

  const draftResult = await (async () => {
    if ("draftId" in args.target) {
      return await getDraftById({
        db: args.db,
        id: args.target.draftId,
        projectId: args.projectId,
        organizationId: args.organizationId,
        withContent: true,
      });
    }

    const { slug, primaryKeyword } = args.target;
    const normalizedSlug = normalizeContentSlug(slug);
    if (!normalizedSlug) {
      return err(new Error("A valid slug is required to create a new draft."));
    }

    return await ensureDraftForSlug({
      db: args.db,
      slug: normalizedSlug,
      primaryKeyword,
      projectId: args.projectId,
      organizationId: args.organizationId,
    }).then((result) =>
      result.ok ? ok(result.value.draft) : err(result.error),
    );
  })();
  if (!draftResult.ok) {
    return draftResult;
  }

  const existingDraft = draftResult.value;
  if (!existingDraft) {
    return err(
      new ORPCError("NOT_FOUND", {
        message: "Draft not found.",
      }),
    );
  }

  const liveInProgressResult = await isWriterTaskLiveInProgress({
    db: args.db,
    draft: existingDraft,
  });
  if (!liveInProgressResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to check current writer workflow status.",
        cause: liveInProgressResult.error,
      }),
    );
  }

  if (
    liveInProgressResult.value ||
    (!existingDraft.generatedByTaskRunId &&
      IN_PROGRESS_DRAFT_STATUSES.has(existingDraft.status))
  ) {
    return ok({
      status: "in_progress",
      draft: existingDraft,
    });
  }

  const hasGeneratedContent = Boolean(existingDraft.contentMarkdown?.trim());
  const requiresConfirmation =
    hasGeneratedContent && !isExplicitDraftTarget && !args.confirmOverwrite;
  if (requiresConfirmation) {
    return ok({
      status: "confirmation_required",
      draft: existingDraft,
    });
  }

  let draft = existingDraft;
  if (Object.keys(metadataUpdates).length > 0) {
    const updatedDraftResult = await updateContentDraft(args.db, {
      id: draft.id,
      projectId: args.projectId,
      organizationId: args.organizationId,
      ...metadataUpdates,
    });
    if (!updatedDraftResult.ok) {
      return err(
        new Error("Failed to update draft before queueing.", {
          cause: updatedDraftResult.error,
        }),
      );
    }
    draft = updatedDraftResult.value;
  }

  if (args.chatId) {
    await addChatContribution({
      db: args.db,
      draftId: draft.id,
      chatId: args.chatId,
    });
  }
  if (args.userId) {
    await addUserContribution({
      db: args.db,
      draftId: draft.id,
      userId: args.userId,
    });
  }

  const taskResult = await createTask({
    db: args.db,
    userId: args.userId,
    input: {
      type: "seo-write-article",
      userId: args.userId,
      projectId: args.projectId,
      organizationId: args.organizationId,
      chatId: args.chatId ?? null,
      draftId: draft.id,
    },
  });
  if (!taskResult.ok) {
    return err(taskResult.error);
  }

  const queuedDraftResult = await updateContentDraft(args.db, {
    id: draft.id,
    projectId: args.projectId,
    organizationId: args.organizationId,
    status: "queued",
    generatedByTaskRunId: taskResult.value.id,
  });
  if (!queuedDraftResult.ok) {
    return err(
      new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to mark draft as queued.",
        cause: queuedDraftResult.error,
      }),
    );
  }

  return ok({
    status: "queued",
    draft: queuedDraftResult.value,
  });
}

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
      case "seo-generate-strategy-drafts": {
        const instance =
          await workflows.seoStrategyDraftPlanningWorkflow.create({
            id: workflowInstanceId ?? `strategy_drafts_${crypto.randomUUID()}`,
            params: input,
          });
        return { provider: "cloudflare" as const, taskId: instance.id };
      }
      case "seo-generate-strategy-snapshot": {
        const instance = await workflows.seoStrategySnapshotWorkflow.create({
          id: workflowInstanceId ?? `strategy_snapshot_${crypto.randomUUID()}`,
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
