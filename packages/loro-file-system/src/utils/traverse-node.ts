import type { LoroTreeNode } from "loro-crdt";
import type { BaseFileSystem } from "../index";

/**
 * Traverses a node and its children in the given order
 * @example
 * traverseNode({ node: rootNode, callback: (node) => { console.log(node.data.get("name")); } });
 * @param args.node - The node to traverse
 * @param args.callback - A function that will be called for each node
 * @param args.order - The order in which to traverse the nodes. Defaults to "pre".
 * @returns void
 */
export function traverseNode<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  node,
  callback,
  order = "pre",
}: {
  node: LoroTreeNode<T>;
  callback: (node: LoroTreeNode<T>) => void;
  order?: "pre" | "post";
}): void {
  if (order === "pre") {
    callback(node);
  }
  const children = node.children() ?? [];
  for (const child of children) {
    traverseNode({ node: child, callback, order });
  }
  if (order === "post") {
    callback(node);
  }
}





