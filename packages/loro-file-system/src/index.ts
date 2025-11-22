import type { Container, LoroTree, LoroTreeNode } from "loro-crdt";

export type BaseFileSystem =
  | {
      type: "dir";
      name: "__root__" | (string & {});
    }
  | {
      type: "file";
      name: string;
    };

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
function normalizePath(path: string | undefined): `/${string}` {
  if (!path || path.trim() === "") {
    return "/";
  }

  // Trim whitespace but preserve internal spaces
  let normalized = path.trim();

  // Ensure a single leading slash
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }

  // Collapse multiple consecutive slashes anywhere in the path
  normalized = normalized.replace(/\/+/g, "/");

  // Remove trailing slash(es) while preserving the root path
  if (normalized.length > 1 && normalized.endsWith("/")) {
    normalized = normalized.replace(/\/+$/g, "");
  }

  return normalized as `/${string}`;
}

/**
 * Slits a given path into segments
 * @example
 * splitPath("/a/b/c") // ["a", "b", "c"]
 * splitPath("/a/b/c/") // ["a", "b", "c"]
 * splitPath("/a/b/c//") // ["a", "b", "c"]
 * @param path - The path to split
 * @returns The segments of the path
 */
function splitPath(path: string): string[] {
  const normalized = normalizePath(path);
  if (normalized === "/") {
    return [];
  }
  return normalized.split("/").filter(Boolean);
}

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

/**
 * Formats a node at the given path using the default formatter
 * @param node - The node to format
 * @param path - The path to the node
 * @returns A string representation of the node at the given path
 */
export function defaultNodeFormatter<
  T extends Record<string, unknown> &
    (
      | (Extract<BaseFileSystem, { type: "file" }> & { fileExtension: string })
      | Extract<BaseFileSystem, { type: "dir" }>
    ),
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
              const fileExtension = node.data.get("fileExtension") as string;
              childFileTypeMapping[fileExtension] ??=
                (childFileTypeMapping[fileExtension] ?? 0) + 1;
            }
          },
        });
        let totalFiles = 0;
        for (const count of Object.values(childFileTypeMapping)) {
          totalFiles += count;
        }

        return `${name}/ [${totalFiles} files in subtree: ${Object.entries(
          childFileTypeMapping,
        )
          .map(([fileExtension, count]) => `${count} *.${fileExtension}`)
          .join(", ")}]`;
      }
      return `- ${name} (${type})`;
    })
    .join("\n    ")}`;
  }
  return `${path} is a path to a file`;
}

/**
 * Lists the nodes at the given path
 * @param args.tree - The tree to list the nodes from
 * @param args.path - The path to the nodes
 * @param args.formatNode - A function that formats the node at the given path
 * @returns A string representation of the nodes at the given path
 */
export function lsOutput<T extends Record<string, unknown> & BaseFileSystem>({
  tree,
  path,
  formatNode,
}: {
  tree: LoroTree<T>;
  path: string;
  formatNode: (node: LoroTreeNode<T>, path: string) => string;
}): string {
  const node = resolvePath({ tree, path });
  if (!node) {
    return `Path ${path} not found`;
  }
  return formatNode(node, path);
}

/**
 * Reads the content of a file at the given path
 * @param args.tree - The tree to read the file from
 * @param args.path - The path to the file
 * @param args.readContent - A function that reads the content of the file
 * @returns A string representation of the content of the file at the given path
 */
export function catOutput<T extends Record<string, unknown> & BaseFileSystem>({
  tree,
  path,
  readContent,
}: {
  tree: LoroTree<T>;
  path: string;
  readContent: (node: LoroTreeNode<T>) => string;
}): string {
  const node = resolvePath({ tree, path });
  if (!node) {
    return `Path ${path} not found`;
  }
  if (node.data.get("type") !== "file") {
    return `Path ${path} is not a file`;
  }
  return readContent(node);
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
 * removeNodeAtPath({ tree, path: "/c",, recursive: false }); // { success: true }
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
  tree.delete(node.id);
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
    return { success: false, message: `Path ${toPath} is not a directory` };
  }

  fromNode.move(toNode);
  return { success: true };
}
