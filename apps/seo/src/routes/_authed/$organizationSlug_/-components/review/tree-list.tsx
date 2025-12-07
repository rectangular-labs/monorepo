"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rectangular-labs/ui/components/ui/input-group";
import {
  AssistiveTreeDescription,
  expandAllFeature,
  hotkeysCoreFeature,
  searchFeature,
  selectionFeature,
  syncDataLoaderFeature,
  Tree,
  TreeItem,
  TreeItemLabel,
  type TreeState,
  useTree,
} from "@rectangular-labs/ui/components/ui/tree";
import { useMemo, useState } from "react";
import {
  type TreeChangeStatus,
  type TreeDirectory,
  type TreeFile,
  type Tree as TreeType,
  traverseTree,
} from "~/lib/campaign/build-tree";
import { FilterStatus } from "./filter-status";

function buildTreeData(tree: TreeType, statusFilter: "all" | TreeChangeStatus) {
  const map = new Map<string, TreeFile | TreeDirectory>();
  const changedMap = new Map<string, TreeFile | TreeDirectory>();
  const expandedItems = new Set<string>();
  const rootLevelDir: TreeDirectory = {
    type: "dir",
    name: "root",
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
    if (
      node.changes &&
      (statusFilter === "all" || node.changes.action === statusFilter)
    ) {
      changedMap.set(node.treeId, node);
      if (node.type === "dir") {
        expandedItems.add(node.treeId);
      }
      // traverse and add all the parent to the map as well.
      let parentNode = map.get(node.parentTreeId ?? "");
      while (parentNode) {
        changedMap.set(parentNode.treeId, parentNode);
        expandedItems.add(parentNode.treeId);
        parentNode = map.get(parentNode.parentTreeId ?? "");
      }
    }
    return { shouldContinue: true };
  });

  for (const item of tree) {
    if (changedMap.has(item.treeId)) {
      rootLevelDir.children.push(item);
    }
  }
  changedMap.set(ROOT_KEY, rootLevelDir);

  return { map: changedMap, expandedItems: Array.from(expandedItems) };
}

const ROOT_KEY = "-1@-1";
const TREE_INDENT = 20;
export function ReviewTreeList({
  tree,
  searchQuery,
  statusFilter,
  onItemSelect,
  onSearchQueryChange,
  onStatusFilterChange,
  summary,
}: {
  tree: TreeType;
  statusFilter: "all" | TreeChangeStatus;
  onStatusFilterChange: (filter: "all" | TreeChangeStatus) => void;
  searchQuery: string | null;
  onSearchQueryChange: React.Dispatch<React.SetStateAction<string | null>>;
  onItemSelect: (itemId: TreeFile["treeId"]) => void;
  summary: Record<TreeChangeStatus, number> & {
    total: number;
  };
}) {
  const [state, setState] = useState<Partial<TreeState<TreeType[number]>>>({});

  const [{ map: treeIdToItemMap, expandedItems }, setTreeData] = useState(
    () => {
      return buildTreeData(tree, "all");
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
          throw new Error(`Item with id ${itemId} not found in `);
        }
        return item;
      },
    },
    features: [
      syncDataLoaderFeature,
      hotkeysCoreFeature,
      searchFeature,
      selectionFeature,
      expandAllFeature,
    ],
    initialState: {
      expandedItems,
    },
    isSearchMatchingItem: (searchQuery, item) => {
      return (
        item.getItemData().type === "file" &&
        item.getItemName().toLowerCase().includes(searchQuery.toLowerCase())
      );
    },
    indent: TREE_INDENT,
    rootItemId: ROOT_KEY,
    getItemName: (item) => item.getItemData().name,
    isItemFolder: (item) => item.getItemData()?.type === "dir",
    setSearch: onSearchQueryChange,
    setState,
    state,
  });

  const onChangeStatusFilter = (statusFilter: "all" | TreeChangeStatus) => {
    onStatusFilterChange(statusFilter);
    const { map: treeIdToItemMap, expandedItems } = buildTreeData(
      tree,
      statusFilter,
    );
    setTreeData({ map: treeIdToItemMap, expandedItems });
    treeHook.scheduleRebuildTree();
    treeHook.setState((prevState: TreeState<TreeDirectory | TreeFile>) => ({
      ...prevState,
      expandedItems,
    }));
  };

  // Handle clearing the search
  const handleClearSearch = () => {
    treeHook.setSearch(null);
  };

  const hasVisibleItems = useMemo(() => {
    const visibleItems = Array.from(treeIdToItemMap.values());
    // Check if there are any visible items matching the search
    return searchQuery
      ? visibleItems.some(
          (item) =>
            item.type === "file" &&
            item.name.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : visibleItems.length > 0;
  }, [searchQuery, treeIdToItemMap]);

  return (
    <div className="flex h-full flex-col gap-2 *:nth-2:grow">
      <InputGroup className="w-full">
        <InputGroupAddon align="inline-start">
          <Icons.Search aria-hidden />
        </InputGroupAddon>
        <InputGroupInput
          placeholder="Filter items..."
          type="search"
          {...treeHook.getSearchInputElementProps()}
          onBlur={undefined}
          onChange={(e) => {
            const value = e.target.value;
            onSearchQueryChange(value);
            treeHook.setSearch(value);
          }}
          value={searchQuery ?? ""}
        />
        {searchQuery && (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              aria-label="Clear search"
              onClick={handleClearSearch}
              size="icon-xs"
              type="button"
            >
              <Icons.CircleX aria-hidden="true" />
            </InputGroupButton>
          </InputGroupAddon>
        )}
        <InputGroupAddon align="inline-end">
          <FilterStatus
            onStatusFilterChange={onChangeStatusFilter}
            statusFilter={statusFilter}
            summary={summary}
          >
            <InputGroupButton size="icon-xs">
              <Icons.Filter />
            </InputGroupButton>
          </FilterStatus>
        </InputGroupAddon>
      </InputGroup>

      <Tree indent={TREE_INDENT} tree={treeHook}>
        {!hasVisibleItems && (
          <p className="px-3 py-4 text-center text-sm">
            No files found for "{searchQuery}"
          </p>
        )}
        {hasVisibleItems &&
          treeHook.getItems().map((item) => {
            return (
              <TreeItem
                // experimental stuff to hide irrelevant tree items
                // see https://coss.com/origin/tree for more details
                // className="data-[visible=false]:hidden"
                // data-visible={isVisible || !searchQuery}
                item={item}
                key={item.getId()}
              >
                <TreeItemLabel
                  className="bg-sidebar"
                  onClick={() => {
                    onItemSelect(item.getItemData().treeId);
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
                    {item.getItemData().type === "file" && (
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
