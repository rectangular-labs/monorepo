import { normalizePath } from "./normalize-path";

/**
 * Splits a given path into segments
 * @example
 * splitPath("/a/b/c") // ["a", "b", "c"]
 * splitPath("/a/b/c/") // ["a", "b", "c"]
 * splitPath("/a/b/c//") // ["a", "b", "c"]
 * @param path - The path to split
 * @returns The segments of the path
 */
export function splitPath(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return [];
  }
  return normalized.split("/").filter(Boolean);
}
