import { ORPCError } from "@orpc/server";
import { schema } from "@rectangular-labs/db";
import {
  createContent,
  createContentSchedule,
  getContentById,
  getContentBySlug,
  getContentScheduleById,
  getDraftById,
  getSeoProjectByIdentifierAndOrgId,
  hardDeleteDraft,
  listDraftsByStatus,
  updateContentDraft,
  updateContentSchedule,
  updateContent as updateSeoContent,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { writeContentDraft } from "../lib/content/write-content-draft";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import {
  DRAFT_NOT_FOUND_ERROR_MESSAGE,
  SLUG_NOT_AVAILABLE_ERROR_MESSAGE,
} from "../lib/workspace/constants";

const reviewStatuses = [
  "pending-review",
  "queued",
  "planning",
  "writing",
  "reviewing-writing",
] as const;
const contentDraftSummarySchema = schema.seoContentDraftSelectSchema.omit(
  "contentMarkdown",
  "outline",
  "notes",
);
function prioritizeStatus<T extends { status: string }>(
  data: readonly T[],
  primary: string,
): T[] {
  return [
    ...data.filter((row) => row.status === primary),
    ...data.filter((row) => row.status !== primary),
  ];
}

const listSuggestions = withOrganizationIdBase
  .route({ method: "GET", path: "/suggestions" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: contentDraftSummarySchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listDraftsByStatus({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      hasBaseContentId: false,
      status: "suggested",
      cursor: input.cursor,
      limit: input.limit + 1,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load suggestions.",
        cause: rowsResult.error,
      });
    }
    const rows = rowsResult.value;

    const page = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? page.at(-1)?.id : undefined;

    return {
      data: page,
      nextPageCursor,
    };
  });

const listNewReviews = withOrganizationIdBase
  .route({ method: "GET", path: "/reviews/new" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: contentDraftSummarySchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listDraftsByStatus({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      hasBaseContentId: false,
      status: reviewStatuses,
      cursor: input.cursor,
      limit: input.limit + 1,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load new reviews.",
        cause: rowsResult.error,
      });
    }
    const rows = rowsResult.value;

    const page = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? page.at(-1)?.id : undefined;

    return {
      data: prioritizeStatus(page, "pending-review"),
      nextPageCursor,
    };
  });

const listUpdateReviews = withOrganizationIdBase
  .route({ method: "GET", path: "/reviews/updates" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: contentDraftSummarySchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listDraftsByStatus({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      hasBaseContentId: true,
      status: reviewStatuses,
      cursor: input.cursor,
      limit: input.limit + 1,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load review updates.",
        cause: rowsResult.error,
      });
    }
    const rows = rowsResult.value;

    const page = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? page.at(-1)?.id : undefined;

    return {
      data: prioritizeStatus(page, "pending-review"),
      nextPageCursor,
    };
  });

const getDraft = withOrganizationIdBase
  .route({ method: "GET", path: "/draft/{id}" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ draft: schema.seoContentDraftSelectSchema }))
  .handler(async ({ context, input }) => {
    const draftResult = await getDraftById({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      id: input.id,
      originatingChatId: null,
      withContent: true,
    });
    if (!draftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get content draft.",
        cause: draftResult.error,
      });
    }
    const draft = draftResult.value;
    if (!draft) {
      throw new ORPCError("NOT_FOUND", { message: "Content draft not found." });
    }
    return { draft };
  });

const updateContent = withOrganizationIdBase
  .route({ method: "PATCH", path: "/draft/{id}" })
  .input(
    schema.seoContentDraftUpdateSchema.merge(
      type({ organizationIdentifier: "string" }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ draft: contentDraftSummarySchema }))
  .handler(async ({ context, input }) => {
    const project = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.projectId,
      context.organization.id,
      {
        publishingSettings: true,
      },
    );
    if (!project.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get project.",
        cause: project.error,
      });
    }
    if (!project.value) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found." });
    }

    const writeResult = await writeContentDraft({
      db: context.db,
      chatId: null,
      userId: context.user.id,
      project: project.value,
      createIfNotExists: false,
      lookup: { type: "id", id: input.id },
      draftNewValues: input,
    });
    if (!writeResult.ok) {
      if (writeResult.error.message === DRAFT_NOT_FOUND_ERROR_MESSAGE) {
        throw new ORPCError("NOT_FOUND", {
          message: writeResult.error.message,
        });
      }
      if (writeResult.error.message === SLUG_NOT_AVAILABLE_ERROR_MESSAGE) {
        throw new ORPCError("BAD_REQUEST", {
          message: writeResult.error.message,
        });
      }

      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update content draft.",
        cause: writeResult.error,
      });
    }

    const {
      contentMarkdown: _contentMarkdown,
      outline: _outline,
      notes: _notes,
      ...draft
    } = writeResult.value.draft;
    return { draft };
  });

const markContent = withOrganizationIdBase
  .route({ method: "POST", path: "/draft/{id}/mark" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      mark: "'yes'|'no'",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      success: "true",
      "draft?": contentDraftSummarySchema.or(type.undefined),
      "contentId?": "string.uuid|undefined",
      "scheduleId?": "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const draftResult = await getDraftById({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      id: input.id,
      originatingChatId: null,
      withContent: false,
    });
    if (!draftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get content draft.",
        cause: draftResult.error,
      });
    }
    if (!draftResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Content draft not found." });
    }
    const draft = draftResult.value;
    const isSuggestion = draft.status === "suggested";

    if (input.mark === "no") {
      const status = isSuggestion ? "suggestion-rejected" : "review-denied";
      const updatedResult = await updateContentDraft(context.db, {
        id: draft.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        status,
      });
      if (!updatedResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to mark content draft.",
          cause: updatedResult.error,
        });
      }
      const {
        contentMarkdown: _contentMarkdown,
        outline: _outline,
        notes: _notes,
        ...summary
      } = updatedResult.value;
      return { success: true as const, draft: summary };
    }

    if (isSuggestion) {
      const updatedResult = await updateContentDraft(context.db, {
        id: draft.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        status: "queued",
      });
      if (!updatedResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to approve suggestion.",
          cause: updatedResult.error,
        });
      }
      const {
        contentMarkdown: _contentMarkdown,
        outline: _outline,
        notes: _notes,
        ...summary
      } = updatedResult.value;
      return { success: true as const, draft: summary };
    }

    if (draft.status !== "pending-review") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Only pending-review drafts can be approved for publishing.",
      });
    }
    if (!draft.articleType) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot approve review: missing articleType.",
      });
    }
    if (!draft.contentMarkdown) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Cannot approve review: missing contentMarkdown.",
      });
    }

    const latestContentForSlugResult = await getContentBySlug({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      slug: draft.slug,
      contentType: "latest",
    });
    if (!latestContentForSlugResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get latest content for slug.",
        cause: latestContentForSlugResult.error,
      });
    }
    const latestContentForSlug = latestContentForSlugResult.value;
    const nextVersion = (latestContentForSlug?.version ?? 0) + 1;

    const createdContentResult = await createContent(context.db, {
      organizationId: context.organization.id,
      projectId: input.projectId,
      createdByUserId: context.user.id,
      version: nextVersion,
      isLiveVersion: false,
      title: draft.title,
      description: draft.description,
      slug: draft.slug,
      primaryKeyword: draft.primaryKeyword,
      notes: draft.notes,
      outline: draft.outline,
      articleType: draft.articleType,
      contentMarkdown: draft.contentMarkdown,
      parentContentId: latestContentForSlug?.id,
    });
    if (!createdContentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to promote draft to content.",
        cause: createdContentResult.error,
      });
    }
    const createdContent = createdContentResult.value;
    if (!createdContent) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to promote draft to content.",
      });
    }

    const draftTarget = draft.targetReleaseDate;
    const earliestPossibleScheduledFor = new Date(Date.now() + 30_000);
    const scheduledFor =
      draftTarget.getTime() < earliestPossibleScheduledFor.getTime()
        ? // If the target date is in the past, bump it into the future so our scheduler can pick it up reliably.
          // This can happen when a draft is generated/held for review longer than its initially planned release time.
          earliestPossibleScheduledFor
        : draftTarget;

    const createdScheduleResult = await createContentSchedule(context.db, {
      organizationId: context.organization.id,
      projectId: input.projectId,
      contentId: createdContent.id,
      destination: "website",
      scheduledFor,
      status: "scheduled",
    });
    if (!createdScheduleResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create schedule.",
        cause: createdScheduleResult.error,
      });
    }
    const createdSchedule = createdScheduleResult.value;
    if (!createdSchedule) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create schedule.",
      });
    }

    const deletedDraftResult = await hardDeleteDraft({
      db: context.db,
      id: draft.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!deletedDraftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete draft after promotion.",
        cause: deletedDraftResult.error,
      });
    }

    const publishWebhookUrl = new URL(
      `/api/rpc/organization/${input.organizationIdentifier}/project/${input.projectId}/content/${createdContent.id}/publish`,
      context.url.origin,
    ).toString();

    await context.scheduler.scheduleTask({
      id: createdSchedule.id,
      description: `publish-content:${createdSchedule.id}`,
      type: "scheduled",
      time: scheduledFor,
      payload: {
        scheduleId: createdSchedule.id,
        // TODO: add a signature that signs the scheduleId for verification
        signature: "string",
      },
      callback: {
        type: "webhook",
        url: publishWebhookUrl,
      },
    });

    return {
      success: true as const,
      contentId: createdContent.id,
      scheduleId: createdSchedule.id,
    };
  });

const publishContent = base
  .route({ method: "POST", path: "/{id}/publish" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      scheduleId: "string.uuid",
      signature: "string",
    }),
  )
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    // TODO: verify the signature
    if (input.signature !== "string") {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid signature." });
    }

    const scheduleResult = await getContentScheduleById({
      db: context.db,
      id: input.scheduleId,
      projectId: input.projectId,
      contentId: input.id,
    });
    if (!scheduleResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get schedule.",
        cause: scheduleResult.error,
      });
    }
    const schedule = scheduleResult.value;
    if (!schedule) {
      throw new ORPCError("NOT_FOUND", { message: "Schedule not found." });
    }
    if (schedule.status !== "scheduled") {
      console.warn("[publishContent] schedule is already published", {
        scheduleId: schedule.id,
        contentId: schedule.contentId,
        organizationId: schedule.organizationId,
        projectId: schedule.projectId,
        scheduledFor: schedule.scheduledFor,
        status: schedule.status,
      });
      return { success: true } as const;
    }

    const contentResult = await getContentById({
      db: context.db,
      id: input.id,
      projectId: input.projectId,
      organizationId: schedule.organizationId,
      withContent: false,
    });
    if (!contentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get content.",
        cause: contentResult.error,
      });
    }
    const content = contentResult.value;
    if (!content) {
      throw new ORPCError("NOT_FOUND", { message: "Content not found." });
    }

    const now = new Date();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (now.getTime() < schedule.scheduledFor.getTime() - fiveMinutesMs) {
      const publishWebhookUrl = new URL(
        `/api/rpc/organization/${input.organizationIdentifier}/project/${input.projectId}/content/${content.id}/publish`,
        context.url.origin,
      ).toString();

      await context.scheduler.scheduleTask({
        id: schedule.id,
        description: `publish-content:${schedule.id}`,
        type: "scheduled",
        time: schedule.scheduledFor,
        payload: {
          scheduleId: schedule.id,
          // TODO: add a signature that signs the scheduleId for verification
          signature: "string",
        },
        callback: {
          type: "webhook",
          url: publishWebhookUrl,
        },
      });

      return { success: true } as const;
    }

    console.info("[publishContent] publishing", {
      scheduleId: schedule.id,
      contentId: content.id,
      organizationId: schedule.organizationId,
      projectId: schedule.projectId,
      scheduledFor: schedule.scheduledFor,
      now,
    });
    // TODO(publication): send a webhook to the publish destination

    const updatedScheduleResult = await updateContentSchedule(context.db, {
      id: schedule.id,
      projectId: schedule.projectId,
      contentId: schedule.contentId,
      organizationId: schedule.organizationId,
      status: "published",
      publishedAt: now,
    });
    if (!updatedScheduleResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update schedule status.",
        cause: updatedScheduleResult.error,
      });
    }

    if (content.parentContentId) {
      const parentUpdateResult = await updateSeoContent(context.db, {
        id: content.parentContentId,
        projectId: schedule.projectId,
        organizationId: schedule.organizationId,
        isLiveVersion: false,
      });
      if (!parentUpdateResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to mark parent content not live.",
          cause: parentUpdateResult.error,
        });
      }
    }
    const updatedContentResult = await updateSeoContent(context.db, {
      id: content.id,
      projectId: schedule.projectId,
      organizationId: schedule.organizationId,
      isLiveVersion: true,
    });
    if (!updatedContentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to mark content live.",
        cause: updatedContentResult.error,
      });
    }

    return { success: true } as const;
  });

export default base
  .prefix("/organization/{organizationIdentifier}/project/{projectId}/content")
  .router({
    listSuggestions,
    listNewReviews,
    listUpdateReviews,
    getDraft,
    updateContent,
    markContent,
    publishContent,
  });
