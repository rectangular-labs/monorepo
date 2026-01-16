import type { DB, schema } from "@rectangular-labs/db";
import {
  getContentBySlug,
  getDraftBySlug,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";

/**
 * Get content for a slug, checking draft first then published content.
 * With the new schema, there's only one draft per slug.
 */
export async function getContentForSlug(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slug: string;
  withContent?: boolean;
}): Promise<
  Result<
    {
      data:
        | {
            source: "draft";
            content: typeof schema.seoContentDraft.$inferSelect;
          }
        | { source: "live"; content: typeof schema.seoContent.$inferSelect };
    },
    Error
  >
> {
  // Check for draft first
  const draftResult = await getDraftBySlug(args);
  if (!draftResult.ok) {
    return draftResult;
  }
  const draft = draftResult.value;
  if (draft) {
    return ok({
      data: { source: "draft", content: draft },
    });
  }

  // Fall back to published content
  const liveResult = await getContentBySlug(args);
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;
  if (!live) {
    return err(new Error(`Slug ${args.slug} not found`));
  }
  return ok({
    data: { source: "live", content: live },
  });
}
