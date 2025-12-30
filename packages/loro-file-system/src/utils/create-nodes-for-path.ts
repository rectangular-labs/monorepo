import type { LoroTree, LoroTreeNode } from "loro-crdt";
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
export async function createNodesForPath<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  tree,
  path,
  finalNodeType,
  onCreateNode,
}: {
  tree: LoroTree<T>;
  path: string;
  finalNodeType: BaseFileSystem["type"];
  onCreateNode?:
    | ((
        currentNode: LoroTreeNode<T>,
      ) => LoroTreeNode<T> | Promise<LoroTreeNode<T>>)
    | undefined;
}): Promise<LoroTreeNode<T>> {
  const segments = splitPath(path);
  const rootNode = resolvePath({ tree, path: "/" });
  if (!rootNode) {
    throw new Error(`BAD_STATE: No root node found`);
  }
  let currentNode = rootNode;
  let currentPath = "";
  const lastSegmentIdx = segments.length - 1;

  for (const [idx, segment] of segments.entries()) {
    currentPath += `/${segment}`;
    const existingNode = resolvePath({ tree, path: currentPath });
    if (!existingNode) {
      currentNode = currentNode.createNode();
      currentNode.data.set("name", segment);
      const nodeType: BaseFileSystem["type"] = (() => {
        if (idx === lastSegmentIdx && finalNodeType === "file") {
          return "file";
        }
        return "dir";
      })();
      currentNode.data.set("type", nodeType);
      if (onCreateNode) {
        currentNode = await Promise.resolve(onCreateNode(currentNode));
      }
    } else {
      currentNode = existingNode;
    }
  }

  return currentNode;
}
