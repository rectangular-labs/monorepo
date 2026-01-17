import type { DB, schema } from "@rectangular-labs/db";
import {
  createContentDraft,
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";

/**
 * Ensure a draft exists for a given slug.
 * With the new schema, there's only one draft per slug.
 */
export async function ensureDraftForSlug(args: {
  db: DB;
  slug: string;
  primaryKeyword?: string | undefined;
  projectId: string;
  organizationId: string;
}): Promise<
  Result<
    { draft: typeof schema.seoContentDraft.$inferSelect; isNew: boolean },
    Error
  >
> {
  const existingDraftResult = await getDraftBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slug,
    withContent: true,
  });
  if (!existingDraftResult.ok) {
    return existingDraftResult;
  }
  if (existingDraftResult.value) {
    return ok({ draft: existingDraftResult.value, isNew: false });
  }

  // Check if there's existing live content for this slug
  const liveResult = await getContentBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slug,
    withContent: true,
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;

  if (live) {
    // Create draft from live content (for editing existing published content)
    const draftResult = await createContentDraft(args.db, {
      organizationId: args.organizationId,
      projectId: args.projectId,
      title: live.title,
      description: live.description,
      slug: args.slug,
      primaryKeyword: live.primaryKeyword,
      notes: live.notes,
      outline: live.outline,
      articleType: live.articleType,
      contentMarkdown: live.contentMarkdown,
      baseContentId: live.id,
      // Schedule for now - it's an update to existing content
      scheduledFor: new Date(),
    });
    if (!draftResult.ok) {
      return draftResult;
    }

    return ok({ draft: draftResult.value, isNew: true });
  }

  // No live content - create brand new draft
  if (!args.primaryKeyword) {
    return err(new Error("Primary keyword is required to create a new draft."));
  }

  const draftResult = await createContentDraft(args.db, {
    projectId: args.projectId,
    organizationId: args.organizationId,
    slug: args.slug,
    primaryKeyword: args.primaryKeyword,
  });
  if (!draftResult.ok) {
    return draftResult;
  }

  return ok({ draft: draftResult.value, isNew: true });
}
