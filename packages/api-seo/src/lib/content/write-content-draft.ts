import { computeNextAvailableScheduleIso } from "@rectangular-labs/core/project/compute-next-available-schedule";
import type { DB, schema } from "@rectangular-labs/db";
import {
  getDraftById,
  updateContentDraft,
  validateSlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { createTask } from "../task";
import {
  DRAFT_NOT_FOUND_ERROR_MESSAGE,
  SLUG_NOT_AVAILABLE_ERROR_MESSAGE,
} from "../workspace/constants";
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
  | "createdAt"
  | "updatedAt"
>;

type WriteContentDraftArgsBase = {
  db: DB;
  chatId: string | null;
  userId: string | null;
  project: Pick<
    typeof schema.seoProject.$inferSelect,
    "id" | "publishingSettings" | "organizationId"
  >;
  createIfNotExists: boolean;
  draftNewValues: DraftUpdates;
};

type WriteContentDraftArgs =
  | (WriteContentDraftArgsBase & { lookup: { type: "id"; id: string } })
  | (WriteContentDraftArgsBase & {
      lookup: { type: "slug"; slug: string; primaryKeyword?: string };
    });

export async function writeContentDraft(
  args: WriteContentDraftArgs,
): Promise<
  Result<{ draft: typeof schema.seoContentDraft.$inferSelect }, Error>
> {
  const normalizedSlugFromInput = args.draftNewValues.slug
    ? normalizeContentSlug(args.draftNewValues.slug)
    : undefined;
  if (args.draftNewValues.slug && !normalizedSlugFromInput) {
    return err(new Error("Invalid slug path."));
  }

  let draft: typeof schema.seoContentDraft.$inferSelect;
  let isNew = false;

  if (args.lookup.type === "id") {
    const draftResult = await getDraftById({
      db: args.db,
      organizationId: args.project.organizationId,
      projectId: args.project.id,
      id: args.lookup.id,
      originatingChatId: args.chatId,
      withContent: true,
    });
    if (!draftResult.ok) return draftResult;
    if (!draftResult.value)
      return err(new Error(DRAFT_NOT_FOUND_ERROR_MESSAGE));
    draft = draftResult.value;
  } else {
    const draftResult = await ensureDraftForSlug({
      db: args.db,
      userId: args.userId,
      projectId: args.project.id,
      originatingChatId: args.chatId,
      organizationId: args.project.organizationId,
      slug: normalizeContentSlug(args.lookup.slug),
      primaryKeyword:
        args.lookup.primaryKeyword ?? args.draftNewValues.primaryKeyword,
      createIfNotExists: args.createIfNotExists,
    });
    if (!draftResult.ok) return draftResult;
    draft = draftResult.value.draft;
    isNew = draftResult.value.isNew;
  }

  const nextSlug = normalizedSlugFromInput ?? draft.slug;
  const nextStatus = args.draftNewValues.status ?? draft.status;
  const updates: DraftUpdates = {
    ...args.draftNewValues,
  };

  if (nextSlug !== draft.slug) {
    const slugValidation = await validateSlug({
      db: args.db,
      organizationId: args.project.organizationId,
      projectId: args.project.id,
      slug: nextSlug,
      ignoreDraftId: draft.id,
      ignoreLiveContentId: draft.baseContentId ?? undefined,
    });
    if (!slugValidation.ok) return slugValidation;
    if (!slugValidation.value.valid) {
      return err(
        new Error(
          `${SLUG_NOT_AVAILABLE_ERROR_MESSAGE}: ${slugValidation.value.reason}`,
        ),
      );
    }
  }

  if (nextStatus !== "suggested" && !updates.targetReleaseDate) {
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
  let updatedDraft = updatedResult.value;

  const path = nextSlug;
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
      const updatedResult = await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        outlineGeneratedByTaskRunId: taskResult.value.id,
      });
      if (!updatedResult.ok) {
        return updatedResult;
      }
      updatedDraft = updatedResult.value;
    }
  }

  if (nextStatus === "queued" && !updatedDraft.generatedByTaskRunId) {
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
      const updatedResult = await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.project.id,
        organizationId: args.project.organizationId,
        generatedByTaskRunId: taskResult.value.id,
      });
      if (!updatedResult.ok) {
        return updatedResult;
      }
      updatedDraft = updatedResult.value;
    }
  }

  return ok({ draft: updatedDraft });
}
