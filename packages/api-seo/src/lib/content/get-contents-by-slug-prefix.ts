import type { DB } from "@rectangular-labs/db";
import {
  getContentsBySlug,
  getDraftsBySlug,
} from "@rectangular-labs/db/operations";
import { ok, type Result } from "@rectangular-labs/result";
import { normalizeContentSlug } from "./normalize-content-slug";

export type ContentSlugStatusEntry = {
  slug: string;
  status: string;
};

export async function getContentsBySlugPrefix(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  originatingChatId: string | null;
  slugPrefix: string;
}): Promise<Result<{ entries: ContentSlugStatusEntry[] }, Error>> {
  const normalizedPrefix = normalizeContentSlug(args.slugPrefix);

  const draftsResult = await getDraftsBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: normalizedPrefix,
    originatingChatId: args.originatingChatId,
    withContent: false,
  });
  if (!draftsResult.ok) {
    return draftsResult;
  }
  const drafts = draftsResult.value;

  const liveResult = await getContentsBySlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug: args.slugPrefix,
    withContent: false,
  });
  if (!liveResult.ok) {
    return liveResult;
  }
  const live = liveResult.value;

  const draftBySlug = new Map<string, (typeof drafts)[number]>();
  for (const draft of drafts) {
    if (!draftBySlug.has(draft.slug)) {
      draftBySlug.set(draft.slug, draft);
    }
  }

  const entries: ContentSlugStatusEntry[] = [];
  for (const draft of draftBySlug.values()) {
    entries.push({ slug: draft.slug, status: draft.status });
  }
  for (const item of live) {
    if (draftBySlug.has(item.slug)) continue;
    entries.push({ slug: item.slug, status: "published" });
  }

  entries.sort((a, b) => a.slug.localeCompare(b.slug));
  return ok({ entries });
}
