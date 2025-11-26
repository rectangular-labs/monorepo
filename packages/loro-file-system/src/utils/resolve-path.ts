import type { Container, LoroTree, LoroTreeNode } from "loro-crdt";
import type { BaseFileSystem } from "../index";
import { splitPath } from "./split-path";

/**
 *
 * @param tree - The tree to resolve the path in
 * @param path - The path to resolve
 * @returns The node at that path
 */
export function resolvePath<
  T extends Record<string, unknown> & BaseFileSystem,
>({ tree, path }: { tree: LoroTree<T>; path: string }): LoroTreeNode<T> | null {
  const segments = splitPath(path);

  const rootNode = (() => {
    const rootItems = tree.roots() as LoroTreeNode<T>[];
    if (rootItems.length > 0) {
      const rootNode = rootItems[0];
      if (!rootNode) {
        throw new Error("BAD_STATE: No root node found");
      }
      return rootNode;
    }
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir" as Exclude<T["type"], Container>);
    return rootNode;
  })();

  if (segments.length === 0) {
    return rootNode;
  }

  let currentQueue = rootNode.children() ?? [];
  const segmentLength = segments.length;
  for (let i = 0; i < segmentLength; ++i) {
    const segment = segments[i];
    if (!segment) {
      throw new Error(
        `BAD STATE: Path segment "${segment}" is not a directory`,
      );
    }

    let firstNode = currentQueue.shift();
    while (firstNode) {
      if (firstNode.data.get("name") === segment) {
        if (i === segmentLength - 1) {
          return firstNode;
        } else {
          currentQueue = firstNode.children() ?? [];
          break;
        }
      }
      firstNode = currentQueue.shift();
    }
  }
  return null;
}
