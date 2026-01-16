import type { DB } from "@rectangular-labs/db";
import {
  getDraftBySlug,
  hardDeleteDraft,
} from "@rectangular-labs/db/operations";
import { ok, type Result } from "@rectangular-labs/result";

/**
 * Delete a draft for a given slug.
 * With the new schema, there's only one draft per slug (no per-chat drafts).
 */
export async function deleteDraftForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
}): Promise<Result<{ success: true }, Error>> {
  const draftResult = await getDraftBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slug,
    withContent: false,
  });

  if (!draftResult.ok) {
    return draftResult;
  }

  const draft = draftResult.value;
  if (!draft) {
    // No draft exists, nothing to delete
    return ok({ success: true });
  }

  const deleted = await hardDeleteDraft({
    db: args.db,
    id: draft.id,
    projectId: args.projectId,
    organizationId: args.organizationId,
  });

  if (!deleted.ok) {
    return deleted;
  }

  return ok({ success: true });
}
