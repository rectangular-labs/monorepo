import type {
  FsNodePayload,
  LoroDocMapping,
} from "@rectangular-labs/api-seo/types";
import { err, ok, type Result } from "@rectangular-labs/result";
import type {
  ContainerID,
  LoroDoc,
  LoroText,
  LoroTreeNode,
  MapDiff,
  TextDiff,
  TreeID,
} from "loro-crdt";

export type TreeChangeStatus = "created" | "deleted" | "updated" | "moved";
export type TreeFile = Extract<FsNodePayload, { type: "file" }> & {
  treeId: TreeID;
  parentTreeId: TreeID | undefined;
  path: string;
  changes:
    | {
        action: TreeChangeStatus;
        name: string | undefined;
        fileExtension: string | undefined;
        content:
          | {
              old: LoroText | undefined;
              diff: TextDiff["diff"];
            }
          | undefined;
      }
    | undefined;
};
export type TreeDirectory = Omit<
  Extract<FsNodePayload, { type: "dir" }>,
  "fileExtension" | "content"
> & {
  treeId: TreeID;
  parentTreeId: TreeID | undefined;
  children: (TreeFile | TreeDirectory)[];
  path: string;
  changes:
    | {
        action: TreeChangeStatus;
        name: string | undefined;
      }
    | undefined;
};
export type Tree = (TreeDirectory | TreeFile)[];

function buildTreeForNode(
  node: LoroTreeNode<FsNodePayload>,
  treeChangeMap: Map<TreeID, { action: "create" | "delete" | "move" }>,
  mapChangeMap: Map<ContainerID, MapDiff["updated"]>,
  textChangeMap: Map<ContainerID, TextDiff["diff"]>,
  deletionMap: Map<string, Tree>,
  textContentMap: Map<ContainerID, LoroText>,
  currentPath: string = "",
): Result<TreeDirectory | TreeFile, Error> {
  const treeChanges = treeChangeMap.get(node.id);
  const mapChanges = mapChangeMap.get(node.data.id);

  const contentId = node.data.get("content")?.id ?? "cid:-1@-1:Text";
  const textChanges = textChangeMap.get(contentId);
  const originalContent = textContentMap.get(contentId);

  let changes: TreeDirectory["changes"] | TreeFile["changes"] | undefined;
  // build changes since something has changed at this particular node
  if (treeChanges || mapChanges || textChanges) {
    let action: TreeChangeStatus | undefined = treeChanges?.action
      ? `${treeChanges.action}d`
      : undefined;
    if (!action && mapChanges) {
      action = "updated";
    }
    if (!action && textChanges) {
      action = "updated";
    }
    if (!action) {
      return err(
        new Error(
          `No action found for node ${node.data.get("name")} (${node.id})`,
        ),
      );
    }

    changes = {
      action,
      name: mapChanges?.name as string | undefined,
      fileExtension: mapChanges?.fileExtension as string | undefined,
      content: textChanges
        ? {
            diff: textChanges,
            old: originalContent,
          }
        : undefined,
    };
  }

  const parentTreeId = node.parent()?.id;
  if (!parentTreeId) {
    return err(
      new Error(
        `BAD STATE: ParentTreeId is undefined even though this should never happen. node ${node.data.get("name")} (${node.id})`,
      ),
    );
  }

  if (node.data.get("type") === "dir") {
    const deletion = deletionMap.get(node.id);
    const newPath = `${currentPath}/${node.data.get("name")}`;

    const childrenResult =
      node
        .children()
        ?.map((child) =>
          buildTreeForNode(
            child,
            treeChangeMap,
            mapChangeMap,
            textChangeMap,
            deletionMap,
            textContentMap,
            newPath,
          ),
        ) ?? [];

    const children: (TreeDirectory | TreeFile)[] = deletion ?? [];
    for (const childResult of childrenResult) {
      if (!childResult.ok) {
        return childResult;
      }
      children.push(childResult.value);
    }

    return ok({
      type: "dir",
      treeId: node.id,
      parentTreeId,
      name: node.data.get("name"),
      path: newPath,
      children,
      changes: changes as TreeDirectory["changes"],
    });
  }
  if (node.data.get("type") === "file") {
    const newPath = `${currentPath}/${node.data.get("name")}`;
    return ok({
      type: "file",
      treeId: node.id,
      parentTreeId,
      name: node.data.get("name"),
      path: newPath,
      content: node.data.get("content") as LoroText,
      fileExtension: node.data.get("fileExtension") as string,
      changes: changes as TreeFile["changes"],
    });
  }
  return err(new Error(`Invalid node type: ${node.data.get("type")}`));
}

export function traverseTree(
  tree: Tree,
  callback: (node: TreeDirectory | TreeFile) => { shouldContinue: boolean },
) {
  for (const node of tree) {
    const { shouldContinue } = callback(node);
    if (node.type === "dir" && shouldContinue) {
      traverseTree(node.children, callback);
    }
  }
}

export function buildTree(
  doc: LoroDoc<LoroDocMapping>,
  baseDocForDiff?: LoroDoc<LoroDocMapping>,
): Result<Tree, Error> {
  const treeChanges = new Map<
    TreeID,
    { action: "create" | "delete" | "move" }
  >();
  const mapChanges = new Map<ContainerID, MapDiff["updated"]>();
  const textChanges = new Map<ContainerID, TextDiff["diff"]>();
  if (baseDocForDiff) {
    const diffDoc = baseDocForDiff.fork() as LoroDoc<LoroDocMapping>;
    const startingFrontiers = diffDoc.oplogFrontiers();
    diffDoc.import(
      doc.export({
        mode: "update",
        from: diffDoc.oplogVersion(),
      }),
    );
    const diff = diffDoc.diff(startingFrontiers, diffDoc.oplogFrontiers());
    for (const [containerId, diffContent] of diff) {
      switch (diffContent.type) {
        case "tree":
          for (const item of diffContent.diff) {
            treeChanges.set(item.target, { action: item.action });
          }
          break;
        case "map": {
          mapChanges.set(containerId, diffContent.updated);
          break;
        }
        case "text": {
          textChanges.set(containerId, diffContent.diff);
          break;
        }
        default: {
          console.warn(`Unsupported diff type: ${diffContent.type}`);
          break;
        }
      }
    }
  }

  const tree = doc.getTree("fs");
  const rootNode = tree.roots()[0] as LoroTreeNode<FsNodePayload> | undefined;
  if (!rootNode) {
    return ok([]);
  }

  // parentTreeId that still in the tree to the deleted tree
  const ROOT_DELETION_KEY = "ROOT_DELETION";
  const deletionMap = new Map<string, Tree>();
  // map from the textId to the original LoroText container before changes were applied
  const textContentMap = new Map<ContainerID, LoroText>();
  if (baseDocForDiff) {
    const baseDocTree = baseDocForDiff.getTree("fs");
    const baseDocRootNode = baseDocTree.roots()[0] as
      | LoroTreeNode<FsNodePayload>
      | undefined;

    const baseDocRootNodeItems = [...(baseDocRootNode?.children() ?? [])];
    const baseFileTree: Tree = [];
    for (const nodeItems of baseDocRootNodeItems) {
      const parsed = buildTreeForNode(
        nodeItems,
        treeChanges,
        mapChanges,
        textChanges,
        deletionMap,
        textContentMap,
      );
      if (!parsed.ok) {
        return parsed;
      }
      baseFileTree.push(parsed.value);
    }
    traverseTree(baseFileTree, (node) => {
      if (node.type === "file" && node.changes?.content) {
        textContentMap.set(node.content.id, node.content);
      } else if (node.changes?.action === "deleted") {
        if (node.parentTreeId && node.parentTreeId !== baseDocRootNode?.id) {
          deletionMap.set(node.parentTreeId, [
            ...(deletionMap.get(node.parentTreeId) ?? []),
            node,
          ]);
        } else if (node.parentTreeId === baseDocRootNode?.id) {
          deletionMap.set(ROOT_DELETION_KEY, [
            ...(deletionMap.get(ROOT_DELETION_KEY) ?? []),
            node,
          ]);
        }
      }
      return { shouldContinue: true };
    });
  }

  const fileTree: Tree = [];
  const rootNodeItems = [...(rootNode.children() ?? [])];
  for (const nodeItems of rootNodeItems) {
    const parsed = buildTreeForNode(
      nodeItems,
      treeChanges,
      mapChanges,
      textChanges,
      deletionMap,
      textContentMap,
    );
    if (!parsed.ok) {
      return parsed;
    }
    fileTree.push(parsed.value);
  }
  const deletion = deletionMap.get(ROOT_DELETION_KEY);
  if (deletion) {
    fileTree.push(...deletion);
  }

  return ok(fileTree);
}
