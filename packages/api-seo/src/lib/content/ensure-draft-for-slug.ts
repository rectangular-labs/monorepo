import type { DB, schema } from "@rectangular-labs/db";
import {
  createContentDraft,
  getDraftBySlug,
  hasPublishedSnapshotForDraft,
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
    const snapshotResult = await hasPublishedSnapshotForDraft({
      db: args.db,
      draftId: existingDraftResult.value.id,
    });
    if (!snapshotResult.ok) {
      return snapshotResult;
    }
    return ok({
      draft: existingDraftResult.value,
      isNew: !snapshotResult.value,
    });
  }

  // no existing draft, create brand new draft
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
