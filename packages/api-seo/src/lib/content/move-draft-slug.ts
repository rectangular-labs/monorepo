import type { DB } from "@rectangular-labs/db";
import { and, eq, schema } from "@rectangular-labs/db";
import {
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";

/**
 * Move a draft from one slug to another.
 * With the new schema, there's only one draft per slug.
 */
export async function moveDraftSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  fromSlug: string;
  toSlug: string;
  userId: string | null;
}): Promise<Result<{ success: true }, Error>> {
  // Check if destination already has a draft
  const existingDestDraftResult = await getDraftBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.toSlug,
    withContent: false,
  });
  if (!existingDestDraftResult.ok) {
    return existingDestDraftResult;
  }
  if (existingDestDraftResult.value) {
    return err(new Error("Destination slug already has a draft."));
  }

  // Check if destination has published content
  const existingDestLiveResult = await getContentBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.toSlug,
    withContent: false,
  });
  if (!existingDestLiveResult.ok) {
    return existingDestLiveResult;
  }
  if (existingDestLiveResult.value) {
    return err(new Error("Destination slug has published content."));
  }

  // Get source draft
  const existingSourceResult = await getDraftBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.fromSlug,
    withContent: false,
  });
  if (!existingSourceResult.ok) {
    return existingSourceResult;
  }
  const existingSource = existingSourceResult.value;

  if (existingSource) {
    // Move the draft
    const [updated] = await args.db
      .update(schema.seoContentDraft)
      .set({
        slug: args.toSlug,
      })
      .where(
        and(
          eq(schema.seoContentDraft.id, existingSource.id),
          eq(schema.seoContentDraft.organizationId, args.organizationId),
          eq(schema.seoContentDraft.projectId, args.projectId),
        ),
      )
      .returning();
    if (!updated) {
      return err(new Error("Failed to move draft."));
    }
    return ok({ success: true });
  }

  // No draft exists - check for published content to create draft from
  const liveResult = await getContentBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.fromSlug,
    withContent: true,
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;
  if (!live) {
    return err(new Error("Source content not found."));
  }

  // Create draft at new slug from live content
  const [draft] = await args.db
    .insert(schema.seoContentDraft)
    .values({
      organizationId: args.organizationId,
      projectId: args.projectId,
      title: live.title,
      description: live.description,
      slug: args.toSlug,
      primaryKeyword: live.primaryKeyword,
      articleType: live.articleType,
      contentMarkdown: live.contentMarkdown,
      status: "pending-review",
    })
    .returning();
  if (!draft) {
    return err(new Error("Failed to create moved draft."));
  }
  return ok({ success: true });
}
