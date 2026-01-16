import type { DB } from "@rectangular-labs/db";
import {
  getContentVersionsBySlug,
  getDraftsBySlugPrefix,
} from "@rectangular-labs/db/operations";
import { ok, type Result } from "@rectangular-labs/result";
import { normalizeContentSlug } from "./normalize-content-slug";

export type ContentSlugStatusEntry = {
  slug: string;
  status: string;
  contentId?: string;
};

/**
 * Get all content entries (drafts and published) matching a slug prefix.
 * With the new schema, there's only one draft per slug.
 */
export async function getContentsBySlugPrefix(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  slugPrefix: string;
}): Promise<Result<{ entries: ContentSlugStatusEntry[] }, Error>> {
  const normalizedPrefix = normalizeContentSlug(args.slugPrefix);

  // Get drafts matching prefix
  const draftsResult = await getDraftsBySlugPrefix({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slugPrefix: normalizedPrefix,
    withContent: false,
  });
  if (!draftsResult.ok) {
    return draftsResult;
  }
  const drafts = draftsResult.value;

  // Get published content matching prefix
  // Note: We need to get all versions and dedupe to latest
  const liveResult = await getContentVersionsBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: normalizedPrefix,
    withContent: false,
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;

  // Build map of drafts by slug (only one per slug now)
  const draftBySlug = new Map<string, (typeof drafts)[number]>();
  for (const draft of drafts) {
    draftBySlug.set(draft.slug, draft);
  }

  // Build map of published content by slug (latest version)
  const liveBySlug = new Map<string, (typeof live)[number]>();
  for (const item of live) {
    const existing = liveBySlug.get(item.slug);
    if (!existing || item.version > existing.version) {
      liveBySlug.set(item.slug, item);
    }
  }

  const entries: ContentSlugStatusEntry[] = [];

  // Add drafts
  for (const draft of draftBySlug.values()) {
    entries.push({
      slug: draft.slug,
      status: draft.status,
      contentId: draft.baseContentId ?? undefined,
    });
  }

  // Add published content (if no draft exists for that slug)
  for (const item of liveBySlug.values()) {
    if (draftBySlug.has(item.slug)) continue;
    entries.push({ slug: item.slug, status: "published", contentId: item.id });
  }

  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  return ok({ entries });
}
