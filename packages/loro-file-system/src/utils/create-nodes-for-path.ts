import type { Container, LoroTree, LoroTreeNode } from "loro-crdt";
import type { BaseFileSystem } from "../index";
import { resolvePath } from "./resolve-path";
import { splitPath } from "./split-path";

/**
 * Creates the nodes along the path and returns the final node
 * @param args.tree - The tree to create the nodes in
 * @param args.path - The path to create the nodes along
 * @param args.finalNodeType - The type of the final node
 * @returns {LoroTreeNode<T>} The final node
 */
export function createNodesForPath<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  tree,
  path,
  finalNodeType,
}: {
  tree: LoroTree<T>;
  path: string;
  finalNodeType: BaseFileSystem["type"];
}): LoroTreeNode<T> {
  const segments = splitPath(path);
  const rootNode = resolvePath({ tree, path: "/" });
  if (!rootNode) {
    throw new Error(`BAD_STATE: No root node found`);
  }
  let currentNode = rootNode;
  let currentPath = "";
  for (const segment of segments) {
    currentPath += `/${segment}`;
    const existingNode = resolvePath({ tree, path: currentPath });
    if (!existingNode) {
      currentNode = currentNode.createNode();
      currentNode.data.set("name", segment);
      currentNode.data.set("type", "dir" as Exclude<T["type"], Container>);
    } else {
      currentNode = existingNode;
    }
  }
  if (finalNodeType === "file") {
    currentNode.data.set("type", "file" as Exclude<T["type"], Container>);
  }

  return currentNode;
}
