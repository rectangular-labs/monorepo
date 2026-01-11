import type { DB } from "@rectangular-labs/db";
import { ok, type Result } from "@rectangular-labs/result";
import {
  type ContentSlugStatusEntry,
  getContentsBySlugPrefix,
} from "./get-contents-by-slug-prefix";
import { normalizeContentSlug } from "./normalize-content-slug";

function formatSlugPath(slug: string): string {
  const normalized = normalizeContentSlug(slug);
  if (!normalized) return "/";
  const needsLeadingSlash = !normalized.startsWith("/");
  return `${needsLeadingSlash ? "/" : ""}${normalized}${normalized.includes(".") ? "" : ".md"}`;
}

function formatFolderPath(slug: string): string {
  const normalized = normalizeContentSlug(slug);
  if (!normalized) return "/";
  const needsLeadingSlash = !normalized.startsWith("/");
  return `${needsLeadingSlash ? "/" : ""}${normalized}/`;
}

function buildDirectoryListing(args: {
  baseSlug: string;
  entries: ContentSlugStatusEntry[];
}): string {
  const normalizedBase = normalizeContentSlug(args.baseSlug);
  const basePrefix = normalizedBase ? `${normalizedBase}/` : "";

  const descendants = args.entries
    .map((entry) => entry)
    .filter((entry) => entry.slug.startsWith(basePrefix));

  const folders = new Set<string>();
  const files = new Map<string, string>();

  for (const entry of descendants) {
    const remainder = entry.slug.slice(basePrefix.length);
    if (!remainder) continue;
    const [first, ...rest] = remainder.split("/").filter(Boolean);
    if (!first) continue;
    if (rest.length === 0) {
      files.set(entry.slug, entry.status);
    } else {
      const folderSlug = `${basePrefix}${first}`.replace(/\/+/g, "/");
      folders.add(folderSlug);
    }
  }

  const folderLines = [...folders]
    .sort((a, b) => a.localeCompare(b))
    .map((folderSlug) => `${formatFolderPath(folderSlug)} (folder)`);

  const fileLines = [...files.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(
      ([slug, status]) => `${formatSlugPath(slug)} (file, status: ${status})`,
    );

  return [...folderLines, ...fileLines].join("\n");
}

// TODO (review): figure out if this implementation makes sense
export async function listContentTree(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  originatingChatId: string | null;
  slug: string;
}): Promise<Result<{ data: string }, Error>> {
  const results = await getContentsBySlugPrefix({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    originatingChatId: args.originatingChatId,
    slugPrefix: args.slug,
  });
  if (!results.ok) return results;

  const normalizedSlug = normalizeContentSlug(args.slug);
  const hasChildren = results.value.entries.some((entry) =>
    normalizedSlug ? entry.slug.startsWith(`${normalizedSlug}/`) : true,
  );

  const listing = hasChildren
    ? buildDirectoryListing({
        baseSlug: normalizedSlug,
        entries: results.value.entries,
      })
    : (() => {
        const exact = results.value.entries.find(
          (entry) => entry.slug === normalizedSlug,
        );
        if (!exact) return "";
        return `${formatSlugPath(exact.slug)} (file, status: ${exact.status})`;
      })();

  return ok({ data: listing });
}
