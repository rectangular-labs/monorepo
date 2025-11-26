/**
 * Normalizes a given path
 * @param path - The path to normalize
 * @returns The normalized path
 * @example
 * normalizePath("/a/b/c") // "/a/b/c"
 * normalizePath("//a//b//c") // "/a/b/c"
 * normalizePath("/a/b/c/") // "/a/b/c"
 * normalizePath("/a/b/c//") // "/a/b/c"
 */
export function normalizePath(path: string | undefined): `/${string}` {
  if (!path || path.trim() === "" || path === ".") {
    return "/";
  }

  // Trim whitespace but preserve internal spaces
  let normalized = path.trim();

  if (normalized.startsWith("./")) {
    return normalizePath(normalized.slice(1));
  }

  // Ensure a single leading slash
  if (!normalized.startsWith("/")) {
    normalized = normalizePath(`/${normalized}`);
  }

  // Collapse multiple consecutive slashes anywhere in the path
  normalized = normalized.replace(/\/+/g, "/");

  // Remove trailing slash(es) while preserving the root path
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/g, "");
  }

  return normalized as `/${string}`;
}
