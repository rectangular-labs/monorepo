export function normalizeContentSlug(path: string): string {
  const trimmed = path.trim();
  const normalized = trimmed.replace(/\/+/g, "/");
  const removeTrailingSlash = normalized.endsWith("/")
    ? normalized.slice(0, -1)
    : normalized;
  if (removeTrailingSlash.startsWith("/")) {
    return removeTrailingSlash;
  }
  return `/${removeTrailingSlash}`;
}
