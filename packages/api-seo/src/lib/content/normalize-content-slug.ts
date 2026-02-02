/**
 * Normalize a slug to kebab-case:
 * - Lowercase
 * - Replace underscores and spaces with hyphens
 * - Remove consecutive hyphens
 * - Remove invalid characters (keep alphanumeric, hyphens, slashes)
 * - Preserve leading slash
 */
function normalizeSlugToKebabCase(slug: string): string {
  const hasLeadingSlash = slug.startsWith("/");
  const normalized = slug
    .toLowerCase()
    .replace(/[\s_]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/-+/g, "-") // Remove consecutive hyphens
    .replace(/[^a-z0-9/-]/g, "") // Remove invalid characters (keep alphanumeric, hyphens, slashes)
    .replace(/-+/g, "-"); // Clean up any remaining consecutive hyphens

  return hasLeadingSlash && !normalized.startsWith("/")
    ? `/${normalized}`
    : normalized;
}

/**
 * Normalize a content slug:
 * - Trim whitespace
 * - Collapse consecutive slashes
 * - Remove trailing slash
 * - Ensure leading slash
 * - Apply kebab-case normalization
 */
export function normalizeContentSlug(path: string): string {
  const trimmed = path.trim();
  const normalized = trimmed.replace(/\/+/g, "/");
  const removeTrailingSlash = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  const withLeadingSlash = removeTrailingSlash.startsWith("/")
    ? removeTrailingSlash
    : `/${removeTrailingSlash}`;

  // Also apply kebab-case normalization for consistency
  return normalizeSlugToKebabCase(withLeadingSlash);
}
