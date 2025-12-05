import { LoroText, type LoroTree, type LoroTreeNode } from "loro-crdt";
import { createNodesForPath } from "./utils/create-nodes-for-path";
import { resolvePath } from "./utils/resolve-path";
import { traverseNode } from "./utils/traverse-node";

export type BaseFileSystem = {
  type: "dir" | "file";
  name: "__root__" | (string & {});
};

/**
 * Formats a node at the given path using the default formatter
 * @param node - The node to format
 * @param path - The path to the node that we are formatting
 * @returns A string representation of the node at the given path
 */
export function defaultNodeFormatter<
  T extends Record<string, unknown> &
    (BaseFileSystem & { fileExtension?: string }),
>(node: LoroTreeNode<T>, path: string): string {
  if (node.data.get("type") === "dir") {
    const children = node.children() ?? [];
    return `${path}:
  ${children
    .map((child) => {
      const name = child.data.get("name");
      const type = child.data.get("type");
      if (type === "dir") {
        const childFileTypeMapping: Record<string, number> = {};
        traverseNode({
          node: child,
          callback: (node) => {
            const nodeType = node.data.get("type");
            if (nodeType === "file") {
              const fileExtension = node.data.get("fileExtension") as
                | string
                | undefined;
              if (fileExtension) {
                childFileTypeMapping[fileExtension] =
                  (childFileTypeMapping[fileExtension] ?? 0) + 1;
              } else {
                childFileTypeMapping.unknown =
                  (childFileTypeMapping.unknown ?? 0) + 1;
              }
            }
          },
        });
        let totalFiles = 0;
        for (const count of Object.values(childFileTypeMapping)) {
          totalFiles += count;
        }

        return `- ${name === "__root__" ? "/" : `${name}/`} [${totalFiles} files in subtree: ${Object.entries(
          childFileTypeMapping,
        )
          .map(([fileExtension, count]) => `${count} *.${fileExtension}`)
          .join(", ")}]`;
      }
      return `- ${name} (${type})`;
    })
    .join("\n    ")}`;
  }
  return `${path} (file)`;
}

/**
 * Lists the nodes at the given path
 * @param args.tree - The tree to list the nodes from
 * @param args.path - The path to the nodes
 * @param args.formatNode - A function that formats the node at the given path
 * @returns { {success: true, data: string}|{success: false, message: string} } {success: true, data: string} if the nodes were listed successfully. { success: false, message: string } if the path was not found
 */
export function lsOutput<T extends Record<string, unknown> & BaseFileSystem>({
  tree,
  path,
  formatNode,
}: {
  tree: LoroTree<T>;
  path: string;
  formatNode: (node: LoroTreeNode<T>, path: string) => string;
}): { success: true; data: string } | { success: false; message: string } {
  const node = resolvePath({ tree, path });
  if (!node) {
    return { success: false, message: `Path ${path} not found` };
  }
  return { success: true, data: formatNode(node, path) };
}

/**
 * Reads the content of a file at the given path
 * @param args.tree - The tree to read the file from
 * @param args.path - The path to the file
 * @param args.readContent - A function that reads the content of the file
 * @returns { {success: true, data: string}|{success: false, message: string} } {success: true, data: string} if the file content was read successfully. { success: false, message: string } if the path was not found or is not a file
 */
export function catOutput<T extends Record<string, unknown> & BaseFileSystem>({
  tree,
  path,
  readContent,
}: {
  tree: LoroTree<T>;
  path: string;
  readContent: (node: LoroTreeNode<T>) => string;
}): { success: true; data: string } | { success: false; message: string } {
  const node = resolvePath({ tree, path });
  if (!node) {
    return { success: false, message: `Path ${path} not found` };
  }
  if (node.data.get("type") !== "file") {
    return {
      success: false,
      message: `Cannot read contents from ${path} because it is not a file`,
    };
  }
  return {
    success: true,
    data: readContent(node as LoroTreeNode<T>),
  };
}

/**
 * Removes a node from the tree at the given path
 * @example
 * const tree = new LoroTree<BaseFileSystem>();
 * const directoryA = tree.createNode({ type: "dir", name: "a" });
 * const directoryAChild = directoryA.createNode({ type: "file", name: "aChild" });
 * const fileB = tree.createNode({ type: "file", name: "b" });
 * const directoryC = tree.createNode({ type: "dir", name: "c" });
 
 * removeNodeAtPath({ tree, path: "/a", recursive: false }); 
 * // ^ { success: false, message: "Directory /a is not empty. Set recursive=true to remove it and all of its children" }
 * removeNodeAtPath({ tree, path: "/a", recursive: true }); // { success: true }
 * removeNodeAtPath({ tree, path: "/a/aChild" }); 
 * // { success: false, message: "Path /a/aChild not found" }
 * removeNodeAtPath({ tree, path: "/b" }); // { success: true }
 * removeNodeAtPath({ tree, path: "/c", recursive: false }); // { success: true }
 * @param {LoroTree<T>} args.tree - The tree to remove the node from
 * @param {string} args.path - The path where the node is located
 * @param {boolean} args.recursive - Default false. Whether to remove the directory node along with all its children
 * @returns { {success: true}|{success: false, message: string} } {success: true} if the node was removed successfully. { success: false, message: string } if the node was not found or cannot be removed
 */
export function removeNodeAtPath<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  tree,
  path,
  recursive = false,
}: {
  tree: LoroTree<T>;
  path: string;
  recursive?: boolean;
}): { success: true } | { success: false; message: string } {
  const node = resolvePath({ tree, path });
  if (!node) {
    return { success: false, message: `Path ${path} not found` };
  }
  if (
    node.data.get("type") === "dir" &&
    !recursive &&
    (node.children()?.length ?? 0) > 0
  ) {
    return {
      success: false,
      message: `Directory ${path} is not empty. Set recursive=true to remove it and all of its children`,
    };
  }
  traverseNode({
    node,
    callback: (node) => {
      tree.delete(node.id);
    },
    order: "post",
  });
  return { success: true };
}

/**
 * Moves a node from one path to another
 * @example
 * const tree = new LoroTree<BaseFileSystem>();
 * const directoryA = tree.createNode({ type: "dir", name: "a" });
 * const directoryAChild = directoryA.createNode({ type: "file", name: "aChild" });
 * const fileB = tree.createNode({ type: "file", name: "b" });
 * const directoryC = tree.createNode({ type: "dir", name: "c" });
 *
 * moveNode({ tree, fromPath: "/a/aChild", toPath: "/c" }); // { success: true }
 * @param {LoroTree<T>} args.tree - The tree to move the node from
 * @param {string} args.fromPath - The path to the node to move
 * @param {string} args.toPath - The path to the new location of the node
 * @returns { {success: true}|{success: false, message: string} } {success: true} if the node was moved successfully. { success: false, message: string } if the node was not found or cannot be moved
 */
export function moveNode<T extends Record<string, unknown> & BaseFileSystem>({
  tree,
  fromPath,
  toPath,
}: {
  tree: LoroTree<T>;
  fromPath: string;
  toPath: string;
}): { success: true } | { success: false; message: string } {
  const fromNode = resolvePath({ tree, path: fromPath });
  if (!fromNode) {
    return { success: false, message: `Path ${fromPath} not found` };
  }
  const toNode = resolvePath({ tree, path: toPath });
  if (!toNode) {
    return { success: false, message: `Path ${toPath} not found` };
  }
  if (toNode.data.get("type") !== "dir") {
    return {
      success: false,
      message: `Cannot move ${fromPath} to ${toPath} because ${toPath} is not a directory`,
    };
  }

  fromNode.move(toNode);
  return { success: true };
}

export function writeToFile<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  tree,
  path,
  content,
  createIfMissing = false,
  contentMapKey = "content",
}: {
  tree: LoroTree<T>;
  path: string;
  content: string;
  createIfMissing?: boolean;
  contentMapKey?: string;
}): { success: true } | { success: false; message: string } {
  const node = resolvePath({ tree, path });
  if (!node) {
    if (createIfMissing) {
      const newNode = createNodesForPath({ tree, path, finalNodeType: "file" });
      newNode.data.setContainer(contentMapKey, new LoroText());
      return writeToFile({
        tree,
        path,
        content,
        createIfMissing: false,
        contentMapKey,
      });
    }
    return { success: false, message: `Path ${path} not found` };
  }
  if (node.data.get("type") !== "file") {
    return {
      success: false,
      message: `Cannot write to ${path} because it is not a file`,
    };
  }
  const textContainer = node.data.get(contentMapKey) as LoroText | undefined;
  if (!textContainer) {
    return {
      success: false,
      message: `Content at ${contentMapKey} was not found`,
    };
  }
  textContainer.updateByLine(content);
  return { success: true };
}
export { resolvePath } from "./utils/resolve-path";
export { traverseNode } from "./utils/traverse-node";
