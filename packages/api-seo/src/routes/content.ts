import { ORPCError } from "@orpc/server";
import {
  contentStatusSchema,
  type SeoFileStatus,
} from "@rectangular-labs/core/schemas/content-parsers";
import { schema } from "@rectangular-labs/db";
import {
  addContentChatContribution,
  addContentUserContribution,
  countDraftsByStatus,
  createContent,
  getDraftById,
  getDraftContributingChats,
  getDraftContributors,
  getNextVersionForSlug,
  getSeoProjectByIdentifierAndOrgId,
  hardDeleteDraft,
  listDraftsByStatus,
  listPublishedContent,
  updateContentDraft,
} from "@rectangular-labs/db/operations";

import { type } from "arktype";
import { base, withOrganizationIdBase } from "../context";
import { writeContentDraft } from "../lib/content/write-content-draft";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import {
  DRAFT_NOT_FOUND_ERROR_MESSAGE,
  SLUG_NOT_AVAILABLE_ERROR_MESSAGE,
} from "../lib/workspace/constants";

const reviewStatuses: SeoFileStatus[] = [
  "pending-review",
  "queued",
  "planning",
  "writing",
  "reviewing-writing",
] as const satisfies SeoFileStatus[];

const contentDraftSummarySchema = schema.seoContentDraftSelectSchema.omit(
  "contentMarkdown",
  "outline",
  "notes",
);

const listDrafts = withOrganizationIdBase
  .route({ method: "GET", path: "/drafts" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      status: contentStatusSchema.array(),
      isNew: "boolean|null",
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
    const hasBaseContentId = input.isNew === null ? null : !input.isNew;
    const rowsResult = await listDraftsByStatus({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      hasBaseContentId,
      status: input.status,
      cursor: input.cursor,
      limit: input.limit + 1,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load drafts.",
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

const listPublished = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      limit: "1<=number<=100 = 20",
      "cursor?": "string|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: schema.seoContentSelectSchema
        .omit("contentMarkdown", "outline", "notes")
        .array(),
      nextPageCursor: "string|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rowsResult = await listPublishedContent({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      cursor: input.cursor,
      limit: input.limit + 1,
    });
    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load published content.",
        cause: rowsResult.error,
      });
    }
    const rows = rowsResult.value;

    const page = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit
        ? page.at(-1)?.publishedAt.getTime().toString()
        : undefined;

    return {
      data: page,
      nextPageCursor,
    };
  });

const getReviewCounts = withOrganizationIdBase
  .route({ method: "GET", path: "/reviews/counts" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      outlines: "number",
      newArticles: "number",
      articleUpdates: "number",
      total: "number",
    }),
  )
  .handler(async ({ context, input }) => {
    const [outlinesResult, newArticlesResult, articleUpdatesResult] =
      await Promise.all([
        countDraftsByStatus({
          db: context.db,
          organizationId: context.organization.id,
          projectId: input.projectId,
          hasBaseContentId: false,
          status: "suggested",
        }),
        countDraftsByStatus({
          db: context.db,
          organizationId: context.organization.id,
          projectId: input.projectId,
          hasBaseContentId: false,
          status: reviewStatuses,
        }),
        countDraftsByStatus({
          db: context.db,
          organizationId: context.organization.id,
          projectId: input.projectId,
          hasBaseContentId: true,
          status: reviewStatuses,
        }),
      ]);

    if (!outlinesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load outline review counts.",
        cause: outlinesResult.error,
      });
    }
    if (!newArticlesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load new article review counts.",
        cause: newArticlesResult.error,
      });
    }
    if (!articleUpdatesResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load article update review counts.",
        cause: articleUpdatesResult.error,
      });
    }

    const outlines = outlinesResult.value;
    const newArticles = newArticlesResult.value;
    const articleUpdates = articleUpdatesResult.value;

    return {
      outlines,
      newArticles,
      articleUpdates,
      total: outlines + newArticles + articleUpdates,
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

const updateDraft = withOrganizationIdBase
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
      projectId: project.value.id,
      organizationId: project.value.organizationId,
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

const markDraft = withOrganizationIdBase
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
      draft: contentDraftSummarySchema,
    }),
  )
  .handler(async ({ context, input }) => {
    const draftResult = await getDraftById({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      id: input.id,
      withContent: true,
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
      return { draft: summary };
    }

    if (isSuggestion) {
      const updatedResult = await writeContentDraft({
        db: context.db,
        chatId: null,
        userId: context.user.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        lookup: { type: "id", id: input.id },
        draftNewValues: { status: "queued" },
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
      } = updatedResult.value.draft;
      return { draft: summary };
    }

    const updatedDraftResult = await writeContentDraft({
      db: context.db,
      chatId: null,
      userId: context.user.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
      lookup: { type: "id", id: input.id },
      draftNewValues: { status: "scheduled" },
    });
    if (!updatedDraftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update draft.",
        cause: updatedDraftResult.error,
      });
    }
    const updatedDraft = updatedDraftResult.value.draft;

    const {
      contentMarkdown: _contentMarkdown,
      outline: _outline,
      notes: _notes,
      ...summary
    } = updatedDraft;
    return {
      draft: summary,
    };
  });

const publishContent = base
  .route({ method: "POST", path: "/draft/{id}/publish" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      draftId: "string.uuid",
      signature: "string",
    }),
  )
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    // TODO: verify the signature
    if (input.signature !== "string") {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid signature." });
    }

    if (input.draftId !== input.id) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft ID does not match route ID.",
      });
    }

    const draftResult = await getDraftById({
      db: context.db,
      organizationId: input.organizationIdentifier,
      projectId: input.projectId,
      id: input.draftId,
      withContent: true,
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
    if (draft.status !== "scheduled") {
      console.warn("[publishContent] draft is not scheduled", {
        draftId: draft.id,
        organizationId: draft.organizationId,
        projectId: draft.projectId,
        scheduledFor: draft.scheduledFor,
        status: draft.status,
      });
      return { success: true } as const;
    }
    if (!draft.scheduledFor) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft is missing scheduled publish time.",
      });
    }

    const now = new Date();
    const fiveMinutesMs = 5 * 60 * 1000;
    if (now.getTime() < draft.scheduledFor.getTime() - fiveMinutesMs) {
      // too early to publish, schedule a task to publish later
      const publishWebhookUrl = new URL(
        `/api/rpc/organization/${draft.organizationId}/project/${draft.projectId}/content/draft/${draft.id}/publish`,
        context.url.origin,
      ).toString();

      await context.scheduler.scheduleTask({
        id: draft.id,
        description: `publish-draft:${draft.id}`,
        type: "scheduled",
        time: draft.scheduledFor,
        payload: {
          draftId: draft.id,
          // TODO: add a signature that signs the draftId for verification
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
      draftId: draft.id,
      organizationId: draft.organizationId,
      projectId: draft.projectId,
      scheduledFor: draft.scheduledFor,
      now,
    });
    // TODO(publication): send a webhook to the publish destination

    // Get next version number for this slug
    const nextVersionResult = await getNextVersionForSlug({
      db: context.db,
      organizationId: draft.organizationId,
      projectId: input.projectId,
      slug: draft.slug,
    });
    if (!nextVersionResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get next version number.",
        cause: nextVersionResult.error,
      });
    }
    const nextVersion = nextVersionResult.value;

    if (!draft.articleType || !draft.contentMarkdown) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Draft is missing articleType or contentMarkdown.",
      });
    }

    const createdContentResult = await createContent(context.db, {
      organizationId: draft.organizationId,
      projectId: draft.projectId,
      slug: draft.slug,
      version: nextVersion,
      title: draft.title,
      description: draft.description,
      primaryKeyword: draft.primaryKeyword,
      articleType: draft.articleType,
      contentMarkdown: draft.contentMarkdown,
      outline: draft.outline,
      notes: draft.notes,
      publishedAt: draft.scheduledFor,
    });
    if (!createdContentResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create published content.",
        cause: createdContentResult.error,
      });
    }
    const createdContent = createdContentResult.value;

    const [draftChatsResult, draftUsersResult] = await Promise.all([
      getDraftContributingChats({
        db: context.db,
        draftId: draft.id,
      }),
      getDraftContributors({
        db: context.db,
        draftId: draft.id,
      }),
    ]);
    if (!draftChatsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load draft chat attribution.",
        cause: draftChatsResult.error,
      });
    }
    if (!draftUsersResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load draft contributor attribution.",
        cause: draftUsersResult.error,
      });
    }

    const [chatAttributionResult, userAttributionResult] = await Promise.all([
      addContentChatContribution({
        db: context.db,
        contentId: createdContent.id,
        chatIds: draftChatsResult.value.map((entry) => entry.chatId),
      }),
      addContentUserContribution({
        db: context.db,
        contentId: createdContent.id,
        userIds: draftUsersResult.value.map((entry) => entry.userId),
      }),
    ]);
    if (!chatAttributionResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to record published content chat attribution.",
        cause: chatAttributionResult.error,
      });
    }
    if (!userAttributionResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to record published content user attribution.",
        cause: userAttributionResult.error,
      });
    }

    const deletedDraftResult = await hardDeleteDraft({
      db: context.db,
      organizationId: draft.organizationId,
      projectId: draft.projectId,
      id: draft.id,
    });
    if (!deletedDraftResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete draft after publishing.",
        cause: deletedDraftResult.error,
      });
    }

    return { success: true } as const;
  });

export default base
  .prefix("/organization/{organizationIdentifier}/project/{projectId}/content")
  .router({
    listDrafts,
    listPublished,
    getReviewCounts,
    getDraft,
    updateDraft,
    markDraft,
    publishContent,
  });
