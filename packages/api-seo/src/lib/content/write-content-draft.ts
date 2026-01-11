import { computeNextAvailableScheduleIso } from "@rectangular-labs/core/project/compute-next-available-schedule";
import type { DB, schema } from "@rectangular-labs/db";
import { updateContentDraft } from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { createTask } from "../task";
import { ensureDraftForSlug } from "./index";
import { normalizeContentSlug } from "./normalize-content-slug";

async function getScheduledItems(args: {
  db: DB;
  organizationId: string;
  projectId: string;
}) {
  const scheduledRows = await args.db.query.seoContentSchedule.findMany({
    columns: {
      scheduledFor: true,
    },
    where: (table, { and, eq, isNull }) =>
      and(
        eq(table.organizationId, args.organizationId),
        eq(table.projectId, args.projectId),
        isNull(table.deletedAt),
      ),
  });

  const draftRows = await args.db.query.seoContentDraft.findMany({
    columns: {
      targetReleaseDate: true,
    },
    where: (table, { and, eq, isNull, ne, isNotNull }) =>
      and(
        eq(table.organizationId, args.organizationId),
        eq(table.projectId, args.projectId),
        isNotNull(table.targetReleaseDate),
        isNull(table.deletedAt),
        ne(table.status, "deleted"),
        ne(table.status, "review-denied"),
        ne(table.status, "suggestion-rejected"),
      ),
  });

  const scheduledItems = [
    ...scheduledRows.map((row) => ({
      scheduledFor: row.scheduledFor ?? null,
    })),
    ...draftRows.map((row) => ({
      scheduledFor: row.targetReleaseDate ?? null,
    })),
  ];

  return scheduledItems;
}

type DraftUpdates = Omit<
  typeof schema.seoContentDraftUpdateSchema.infer,
  | "id"
  | "projectId"
  | "organizationId"
  | "originatingChatId"
  | "createdByUserId"
  | "baseContentId"
> & {
  slug: string;
  primaryKeyword: string;
};
export async function writeContentDraft(args: {
  db: DB;
  chatId?: string | null;
  userId?: string | null;
  project: Pick<
    typeof schema.seoProject.$inferSelect,
    "id" | "publishingSettings" | "organizationId"
  >;
  draftNewValues: DraftUpdates;
}): Promise<Result<{ message: string }, Error>> {
  const normalizedSlug = normalizeContentSlug(args.draftNewValues.slug);
  if (!normalizedSlug) {
    return err(new Error("Invalid slug path."));
  }

  const draftResult = await ensureDraftForSlug({
    db: args.db,
    userId: args.userId ?? null,
    projectId: args.project.id,
    originatingChatId: args.chatId ?? null,
    organizationId: args.project.organizationId,
    slug: normalizedSlug,
    primaryKeyword: args.draftNewValues.primaryKeyword,
  });
  if (!draftResult.ok) {
    return draftResult;
  }

  const { draft, isNew } = draftResult.value;
  const updates: DraftUpdates = {
    ...args.draftNewValues,
  };

  const nextStatus = args.draftNewValues.status ?? draft.status;

  if (isNew && nextStatus !== "suggested" && !updates.targetReleaseDate) {
    const cadence = args.project.publishingSettings?.cadence;
    if (cadence) {
      const scheduledItems = await getScheduledItems({
        db: args.db,
        organizationId: args.project.organizationId,
        projectId: args.project.id,
      });
      const scheduledIso = computeNextAvailableScheduleIso({
        cadence,
        scheduledItems,
      });
      if (scheduledIso) {
        updates.targetReleaseDate = new Date(scheduledIso);
      }
    }
  }

  const updatedResult = await updateContentDraft(args.db, {
    id: draft.id,
    organizationId: args.project.organizationId,
    projectId: args.project.id,
    ...updates,
  });
  if (!updatedResult.ok) {
    return updatedResult;
  }
  const updatedDraft = updatedResult.value;

  const path = normalizedSlug;
  if (
    isNew &&
    nextStatus === "suggested" &&
    !updatedDraft.outlineGeneratedByTaskRunId
  ) {
    const taskResult = await createTask({
      db: args.db,
      userId: args.userId ?? undefined,
      input: {
        type: "seo-plan-keyword",
        userId: args.userId ?? undefined,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        chatId: args.chatId ?? null,
        path,
      },
    });
    if (taskResult.ok) {
      await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        outlineGeneratedByTaskRunId: taskResult.value.id,
      });
    }
  }

  if (isNew && nextStatus === "queued" && !updatedDraft.generatedByTaskRunId) {
    const taskResult = await createTask({
      db: args.db,
      userId: args.userId ?? undefined,
      input: {
        type: "seo-write-article",
        userId: args.userId ?? undefined,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        chatId: args.chatId ?? null,
        path,
      },
    });
    if (taskResult.ok) {
      await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        generatedByTaskRunId: taskResult.value.id,
      });
    }
  }

  return ok({ message: "Draft updated." });
}
