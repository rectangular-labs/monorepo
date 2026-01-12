import type { DB, schema } from "@rectangular-labs/db";
import {
  createContentDraft,
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { DRAFT_NOT_FOUND_ERROR_MESSAGE } from "../workspace/constants";

export async function ensureDraftForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  primaryKeyword?: string | undefined;
  originatingChatId: string | null;
  userId: string | null;
  createIfNotExists?: boolean;
}): Promise<
  Result<
    { draft: typeof schema.seoContentDraft.$inferSelect; isNew: boolean },
    Error
  >
> {
  const existingDraftResult = await getDraftBySlug(args);
  if (!existingDraftResult.ok) {
    return existingDraftResult;
  }
  if (existingDraftResult.value) {
    return ok({ draft: existingDraftResult.value, isNew: false });
  }

  if (!args.createIfNotExists) {
    return err(new Error(DRAFT_NOT_FOUND_ERROR_MESSAGE));
  }

  const liveResult = await getContentBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slug,
    contentType: "live",
    withContent: true,
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;
  if (live) {
    // TODO: some status for updated content?
    const draftResult = await createContentDraft(args.db, {
      organizationId: args.organizationId,
      projectId: args.projectId,
      baseContentId: live.id,
      originatingChatId: args.originatingChatId,
      createdByUserId: args.userId,
      title: live.title,
      description: live.description,
      slug: args.slug,
      primaryKeyword: live.primaryKeyword,
      notes: live.notes,
      outlineGeneratedByTaskRunId: live.outlineGeneratedByTaskRunId,
      outline: live.outline,
      generatedByTaskRunId: live.generatedByTaskRunId,
      articleType: live.articleType,
      contentMarkdown: live.contentMarkdown,
      // set to now, but really it'll be in the past once the draft eventually gets approved/published. which means it'll go live ASAP.
      // Makes sense since it's an update to existing content.
      targetReleaseDate: new Date(),
    });
    if (!draftResult.ok) {
      return draftResult;
    }
    return ok({ draft: draftResult.value, isNew: true });
  }

  if (!args.primaryKeyword) {
    return err(new Error("Primary keyword is required to create a new draft."));
  }

  const draftResult = await createContentDraft(args.db, {
    projectId: args.projectId,
    createdByUserId: args.userId,
    organizationId: args.organizationId,
    originatingChatId: args.originatingChatId,
    slug: args.slug,
    primaryKeyword: args.primaryKeyword,
  });
  if (!draftResult.ok) {
    return draftResult;
  }
  return ok({ draft: draftResult.value, isNew: true });
}
