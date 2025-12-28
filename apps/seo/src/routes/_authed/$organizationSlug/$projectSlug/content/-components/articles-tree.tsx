"use client";

import type { SeoFileStatus } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  AssistiveTreeDescription,
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
  syncDataLoaderFeature,
  Tree,
  TreeItem,
  TreeItemLabel,
  type TreeState,
  useTree,
} from "@rectangular-labs/ui/components/ui/tree";
import { useEffect, useMemo, useState } from "react";
import type {
  TreeDirectory,
  TreeFile,
  Tree as TreeType,
} from "~/lib/campaign/build-tree";
import { traverseTree } from "~/lib/campaign/build-tree";

function buildTreeData({
  tree,
  statusFilter,
  includeFile,
}: {
  tree: TreeType;
  statusFilter: "all" | SeoFileStatus;
  includeFile: (file: TreeFile, statusFilter: "all" | SeoFileStatus) => boolean;
}) {
  const map = new Map<string, TreeFile | TreeDirectory>();
  const filteredMap = new Map<string, TreeFile | TreeDirectory>();
  const expandedItems = new Set<string>();
  const rootLevelDir: TreeDirectory = {
    type: "dir",
    name: "root",
    createdAt: new Date().toISOString(),
    children: [],
    treeId: ROOT_KEY,
    parentTreeId: undefined,
    path: "/",
    changes: undefined,
  };

  traverseTree(tree, (node) => {
    map.set(node.treeId, node);
    return { shouldContinue: true };
  });

  traverseTree(tree, (node) => {
    if (node.type === "file" && includeFile(node, statusFilter)) {
      filteredMap.set(node.treeId, node);
      let parentNode = map.get(node.parentTreeId ?? "");
      while (parentNode) {
        filteredMap.set(parentNode.treeId, parentNode);
        expandedItems.add(parentNode.treeId);
        parentNode = map.get(parentNode.parentTreeId ?? "");
      }
    }
    return { shouldContinue: true };
  });

  for (const item of tree) {
    if (filteredMap.has(item.treeId)) {
      rootLevelDir.children.push(item);
    }
  }
  filteredMap.set(ROOT_KEY, rootLevelDir);

  return { map: filteredMap, expandedItems: Array.from(expandedItems) };
}

const ROOT_KEY = "-1@-1";
const TREE_INDENT = 20;

export function ArticlesTree({
  tree,
  statusFilter,
  includeFile,
  onFileSelect,
}: {
  tree: TreeType;
  statusFilter: "all" | SeoFileStatus;
  includeFile: (file: TreeFile, statusFilter: "all" | SeoFileStatus) => boolean;
  onFileSelect: (fileTreeId: TreeFile["treeId"]) => void;
}) {
  const [state, setState] = useState<Partial<TreeState<TreeType[number]>>>({});
  const [{ map: treeIdToItemMap, expandedItems }, setTreeData] = useState(
    () => {
      return buildTreeData({ tree, statusFilter, includeFile });
    },
  );

  const treeHook = useTree<TreeType[number]>({
    dataLoader: {
      getChildren: (itemId) => {
        const item = treeIdToItemMap.get(itemId);
        if (!item || item.type === "file") {
          return [];
        }
        const childrenId = item.children
          .map((child) => child.treeId)
          .filter((id) => treeIdToItemMap.has(id));
        return childrenId;
      },
      getItem: (itemId) => {
        const item = treeIdToItemMap.get(itemId);
        if (!item) {
          throw new Error(`Item with id ${itemId} not found in tree`);
        }
        return item;
      },
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      selectionFeature,
      expandAllFeature,
    ],
    initialState: {
      expandedItems,
    },
    indent: TREE_INDENT,
    rootItemId: ROOT_KEY,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData()?.type === "dir",
    setState,
    state,
  });

  useEffect(() => {
    const { map: nextMap, expandedItems: nextExpanded } = buildTreeData({
      tree,
      statusFilter,
      includeFile,
    });
    setTreeData({ map: nextMap, expandedItems: nextExpanded });
    treeHook.scheduleRebuildTree();
    treeHook.setState((prevState: TreeState<TreeDirectory | TreeFile>) => ({
      ...prevState,
      expandedItems: nextExpanded,
    }));
  }, [tree, statusFilter, includeFile, treeHook]);

  const hasVisibleItems = useMemo(() => {
    // subtract our synthetic root node
    return treeIdToItemMap.size > 1;
  }, [treeIdToItemMap]);

  return (
    <div className="flex h-full flex-col gap-2">
      <Tree indent={TREE_INDENT} tree={treeHook}>
        {!hasVisibleItems && (
          <p className="px-3 py-4 text-center text-muted-foreground text-sm">
            No files found.
          </p>
        )}
        {hasVisibleItems &&
          treeHook.getItems().map((item) => {
            const isFile = item.getItemData().type === "file";
            return (
              <TreeItem item={item} key={item.getId()}>
                <TreeItemLabel
                  className="bg-background"
                  onClick={() => {
                    if (isFile) {
                      onFileSelect(item.getItemData().treeId);
                    }
                  }}
                  title={item.getItemData().path}
                >
                  <span className="flex w-full items-center gap-2">
                    {item.isFolder() &&
                      (item.isExpanded() ? (
                        <Icons.FolderOpen className="pointer-events-none size-4 text-muted-foreground" />
                      ) : (
                        <Icons.Folder className="pointer-events-none size-4 text-muted-foreground" />
                      ))}
                    {isFile && (
                      <Icons.File className="pointer-events-none size-4 text-muted-foreground" />
                    )}
                    <span className="truncate">{item.getItemName()}</span>
                  </span>
                </TreeItemLabel>
              </TreeItem>
            );
          })}
        <AssistiveTreeDescription tree={treeHook} />
      </Tree>
    </div>
  );
}
