import type { LoroTreeNode } from "loro-crdt";
import type { BaseFileSystem } from "../index";

export function getNodePath<T extends Record<string, unknown> & BaseFileSystem>(
  node: LoroTreeNode<T>,
): string {
  const segments: string[] = [];
  let current: LoroTreeNode<T> | null = node;

  while (current) {
    const name = current.data.get("name");
    if (typeof name === "string" && name.trim() && name !== "__root__") {
      segments.push(name);
    }
    current = current.parent() as LoroTreeNode<T> | null;
  }

  if (segments.length === 0) return "/";
  return `/${segments.reverse().join("/")}`;
}
