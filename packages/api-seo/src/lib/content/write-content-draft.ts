import { computeNextAvailableScheduleIso } from "@rectangular-labs/core/project/compute-next-available-schedule";
import type { DB, schema } from "@rectangular-labs/db";
import {
  addChatContribution,
  addUserContribution,
  getCurrentStrategyPhase,
  getDraftById,
  getScheduledItems,
  hasPublishedSnapshotForDraft,
  updateContentDraft,
  validateSlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { apiEnv } from "../../env";
import { createSignature } from "../create-signature";
import { createScheduler } from "../scheduler";
import { createTask } from "../task";
import {
  DRAFT_NOT_FOUND_ERROR_MESSAGE,
  SLUG_NOT_AVAILABLE_ERROR_MESSAGE,
} from "../workspace/constants";
import { ensureDraftForSlug } from "./ensure-draft-for-slug";
import { normalizeContentSlug } from "./normalize-content-slug";

type DraftUpdates = Omit<
  typeof schema.seoContentDraftUpdateSchema.infer,
  "id" | "projectId" | "organizationId" | "createdAt" | "updatedAt"
>;

type WriteContentDraftArgsBase = {
  db: DB;
  chatId: string | null;
  userId: string | null;
  projectId: string;
  organizationId: string;
  draftNewValues: DraftUpdates;
};

export type WriteContentDraftArgs =
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
  if (args.lookup.type === "id") {
    const draftResult = await getDraftById({
      db: args.db,
      organizationId: args.organizationId,
      projectId: args.projectId,
      id: args.lookup.id,
      withContent: true,
    });
    if (!draftResult.ok) return draftResult;
    if (!draftResult.value)
      return err(new Error(DRAFT_NOT_FOUND_ERROR_MESSAGE));
    draft = draftResult.value;
  } else {
    const draftResult = await ensureDraftForSlug({
      db: args.db,
      projectId: args.projectId,
      organizationId: args.organizationId,
      slug: normalizeContentSlug(args.lookup.slug),
      primaryKeyword:
        args.lookup.primaryKeyword ?? args.draftNewValues.primaryKeyword,
    });
    if (!draftResult.ok) return draftResult;
    draft = draftResult.value.draft;
  }

  // Record attribution
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

  const nextSlug = normalizedSlugFromInput ?? draft.slug;
  const nextStatus = args.draftNewValues.status ?? draft.status;
  const updates: DraftUpdates = {
    ...args.draftNewValues,
  };

  if (nextSlug !== draft.slug) {
    const slugValidation = await validateSlug({
      db: args.db,
      organizationId: args.organizationId,
      projectId: args.projectId,
      slug: nextSlug,
      ignoreDraftId: draft.id,
      ignoreOriginatingDraftId: draft.id,
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
  if (
    nextStatus === "scheduled" &&
    (!draft.articleType || !draft.contentMarkdown)
  ) {
    return err(
      new Error(
        "Cannot schedule content: missing articleType or contentMarkdown review.",
      ),
    );
  }

  const updatedResult = await updateContentDraft(args.db, {
    id: draft.id,
    organizationId: args.organizationId,
    projectId: args.projectId,
    ...updates,
  });
  if (!updatedResult.ok) {
    return updatedResult;
  }
  let updatedDraft = updatedResult.value;

  if (nextStatus === "suggested" && !updatedDraft.outlineGeneratedByTaskRunId) {
    const taskResult = await createTask({
      db: args.db,
      userId: args.userId ?? undefined,
      input: {
        type: "seo-plan-keyword",
        userId: args.userId ?? undefined,
        projectId: args.projectId,
        organizationId: args.organizationId,
        chatId: args.chatId ?? null,
        draftId: draft.id,
      },
    });
    if (taskResult.ok) {
      const updatedResult = await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.projectId,
        organizationId: args.organizationId,
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
        projectId: args.projectId,
        organizationId: args.organizationId,
        chatId: args.chatId ?? null,
        draftId: draft.id,
      },
    });
    if (taskResult.ok) {
      const updatedResult = await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.projectId,
        organizationId: args.organizationId,
        generatedByTaskRunId: taskResult.value.id,
      });
      if (!updatedResult.ok) {
        return updatedResult;
      }
      updatedDraft = updatedResult.value;
    }
  }

  const hasPublishedSnapshotResult = await hasPublishedSnapshotForDraft({
    db: args.db,
    draftId: draft.id,
  });
  if (!hasPublishedSnapshotResult.ok) {
    return hasPublishedSnapshotResult;
  }
  const hasPublishedSnapshot = hasPublishedSnapshotResult.value;

  if (nextStatus === "scheduled") {
    // Determine scheduled publish time
    let scheduledFor = updatedDraft.scheduledFor;

    // new content should be scheduled if it's part of a strategy phase
    if (!scheduledFor && !hasPublishedSnapshot && updatedDraft.strategyId) {
      const currentPhase = await getCurrentStrategyPhase({
        db: args.db,
        strategyId: updatedDraft.strategyId,
      });
      if (!currentPhase.ok) {
        return currentPhase;
      }
      const { cadence } = currentPhase.value;
      const scheduledItemsResult = await getScheduledItems({
        db: args.db,
        organizationId: draft.organizationId,
        projectId: draft.projectId,
        strategyId: updatedDraft.strategyId,
        phaseId: currentPhase.value.id,
      });
      if (scheduledItemsResult.ok) {
        const scheduledItems = scheduledItemsResult.value;
        const scheduledIso = computeNextAvailableScheduleIso({
          cadence,
          scheduledItems: scheduledItems.filter(
            (item): item is { scheduledFor: Date } =>
              item.scheduledFor !== null,
          ),
        });
        if (scheduledIso) {
          scheduledFor = new Date(scheduledIso);
        }
      }
    }

    if (!scheduledFor) {
      // Default to now if no cadence configured.
      // this mostly happens for updates to existing content or if we cannot find a suitable schedule.
      scheduledFor = new Date();
    }

    if (!updatedDraft.scheduledFor) {
      const updatedResult = await updateContentDraft(args.db, {
        id: updatedDraft.id,
        projectId: args.projectId,
        organizationId: args.organizationId,
        scheduledFor,
      });
      if (!updatedResult.ok) {
        return updatedResult;
      }
      updatedDraft = updatedResult.value;
    }

    const publishWebhookUrl = new URL(
      `/api/organization/${draft.organizationId}/project/${draft.projectId}/content/draft/${draft.id}/publish`,
      apiEnv().SEO_URL,
    ).href;

    const earliestPossibleScheduledFor = new Date(Date.now() + 30_000);
    const actualScheduledFor =
      scheduledFor.getTime() < earliestPossibleScheduledFor.getTime()
        ? // If the target date is in the past, bump it into the future so our scheduler can pick it up reliably.
          // This can happen when a draft is generated/held for review longer than its initially planned release time.
          earliestPossibleScheduledFor
        : scheduledFor;

    const scheduler = createScheduler();

    const signature = createSignature(draft.id);
    await scheduler.scheduleTask({
      id: draft.id,
      description: `publish-draft:${draft.id}`,
      type: "scheduled",
      time: actualScheduledFor,
      payload: {
        draftId: draft.id,
        signature,
      },
      callback: {
        type: "webhook",
        url: publishWebhookUrl,
      },
    });
  }

  return ok({ draft: updatedDraft, isNew: !hasPublishedSnapshot });
}
