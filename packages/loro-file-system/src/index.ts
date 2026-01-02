import {
  type Container,
  LoroText,
  type LoroTree,
  type LoroTreeNode,
} from "loro-crdt";
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
  T extends Record<string, unknown> & BaseFileSystem,
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
              const fileSplit = node.data.get("name")?.split(".");
              if (fileSplit?.length === 1) {
                childFileTypeMapping.unknown =
                  (childFileTypeMapping.unknown ?? 0) + 1;
              } else {
                const fileExtension = fileSplit?.at(-1);
                if (fileExtension) {
                  childFileTypeMapping[fileExtension] =
                    (childFileTypeMapping[fileExtension] ?? 0) + 1;
                }
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

export interface WriteToFileArgs<
  T extends Record<string, unknown> & BaseFileSystem,
> {
  tree: LoroTree<T>;
  path: string;
  content?: string | undefined;
  createIfMissing?: boolean | undefined;
  contentMapKey?: string | undefined;
  metadata?: { key: string; value: string }[] | undefined;
  onCreateNode?:
    | ((
        currentNode: LoroTreeNode<T>,
      ) => LoroTreeNode<T> | Promise<LoroTreeNode<T>>)
    | undefined;
}

type WriteToFileResult =
  | {
      success: true;
    }
  | {
      success: false;
      message: string;
    };
export async function writeToFile<
  T extends Record<string, unknown> & BaseFileSystem,
>({
  tree,
  path,
  content,
  createIfMissing = false,
  contentMapKey = "content",
  metadata,
  onCreateNode,
}: WriteToFileArgs<T>): Promise<WriteToFileResult> {
  const node = resolvePath({ tree, path });
  if (!node) {
    if (createIfMissing) {
      const newNode = await createNodesForPath({
        tree,
        path,
        finalNodeType: "file",
        onCreateNode,
      });
      newNode.data.setContainer(contentMapKey, new LoroText());
      return await writeToFile({
        tree,
        path,
        content,
        createIfMissing: false,
        contentMapKey,
        metadata,
        onCreateNode,
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

  if (metadata && metadata.length > 0) {
    for (const item of metadata) {
      const key = item.key?.trim();
      if (!key) continue;
      node.data.set(key, item.value as Exclude<T[string], Container>);
    }
  }
  if (content) {
    textContainer.updateByLine(content);
  }
  return { success: true };
}

type WriteToFileMiddlewareContext<
  T extends Record<string, unknown> & BaseFileSystem,
  TContext,
> = Omit<WriteToFileArgs<T>, "metadata"> & {
  /**
   * Arbitrary middleware context, injected by the caller.
   */
  context: TContext;
  /**
   * Adds an onCreateNode hook that will be applied to every newly created node
   * created by this write operation (directories + file).
   */
  addOnCreateNode: (
    fn: (
      currentNode: LoroTreeNode<T>,
    ) => LoroTreeNode<T> | Promise<LoroTreeNode<T>>,
  ) => void;
  /**
   * Reads the current node at path (if any).
   */
  getExistingNode: () => LoroTreeNode<T> | null;
  /**
   * Get pending metadata value (last write wins) by key.
   */
  getMetadata: (key: string) => string | undefined;
  /**
   * Set pending metadata value (last write wins) by key.
   */
  setMetadata: (key: string, value: string) => void;
  /**
   * Returns pending metadata as an array (order not guaranteed).
   */
  toMetadataArray: () => { key: string; value: string }[];
};
export type WriteToFileMiddleware<
  T extends Record<string, unknown> & BaseFileSystem,
  TContext = unknown,
> = (args: {
  ctx: WriteToFileMiddlewareContext<T, TContext>;
  next: () => Promise<WriteToFileResult>;
}) => Promise<WriteToFileResult>;

function composeWriteToFileMiddleware<
  T extends Record<string, unknown> & BaseFileSystem,
  TContext,
>(
  middleware: WriteToFileMiddleware<T, TContext>[],
  handler: () => Promise<WriteToFileResult>,
  ctx: WriteToFileMiddlewareContext<T, TContext>,
): Promise<WriteToFileResult> {
  let idx = -1;
  const dispatch = async (i: number): Promise<WriteToFileResult> => {
    if (i <= idx) {
      return {
        success: false,
        message: "writeToFile middleware called next() multiple times",
      };
    }
    idx = i;
    const fn = middleware[i];
    if (!fn) return await handler();
    return await fn({ ctx, next: () => dispatch(i + 1) });
  };
  return dispatch(0);
}

export function createWriteToFile<
  T extends Record<string, unknown> & BaseFileSystem,
  TContext,
>(options?: { middleware?: WriteToFileMiddleware<T, TContext>[] }) {
  const middleware = options?.middleware ?? [];
  return {
    use(mw: WriteToFileMiddleware<T, TContext>) {
      middleware.push(mw);
      return this;
    },
    async writeToFile(
      args: WriteToFileArgs<T> & { context: TContext },
    ): Promise<WriteToFileResult> {
      const metadataMap = new Map(
        args.metadata
          ? args.metadata.map(({ key, value }) => [key, value])
          : [],
      );
      const onCreateNodeHooks: ((
        currentNode: LoroTreeNode<T>,
      ) => LoroTreeNode<T> | Promise<LoroTreeNode<T>>)[] = [];

      const ctx: WriteToFileMiddlewareContext<T, TContext> = {
        ...args,
        context: args.context,
        addOnCreateNode: (fn) => {
          onCreateNodeHooks.push(fn);
        },
        getExistingNode: () =>
          resolvePath({ tree: args.tree, path: args.path }),
        getMetadata: (key) => metadataMap.get(key),
        setMetadata: (key, value) => {
          const normalized = key.trim();
          if (!normalized) return;
          metadataMap.set(normalized, value);
        },
        toMetadataArray: () =>
          Array.from(metadataMap.entries()).map(([key, value]) => ({
            key,
            value,
          })),
      };

      const handler = async (): Promise<WriteToFileResult> => {
        const result: WriteToFileResult = await writeToFile({
          tree: args.tree,
          path: args.path,
          content: args.content,
          createIfMissing: args.createIfMissing,
          contentMapKey: args.contentMapKey,
          metadata: ctx.toMetadataArray(),
          onCreateNode: async (node) => {
            let current = node;
            for (const hook of onCreateNodeHooks) {
              current = await Promise.resolve(hook(current));
            }
            return current;
          },
        });
        return result;
      };

      return await composeWriteToFileMiddleware(middleware, handler, ctx);
    },
  };
}

export { getNodePath } from "./utils/get-node-path";
export { normalizePath } from "./utils/normalize-path";
export { resolvePath } from "./utils/resolve-path";
export { traverseNode } from "./utils/traverse-node";
