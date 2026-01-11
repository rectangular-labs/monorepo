export function normalizeContentSlug(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") return "";
  let normalized = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  normalized = normalized.replace(/\/+/g, "/");
  return normalized;
}
