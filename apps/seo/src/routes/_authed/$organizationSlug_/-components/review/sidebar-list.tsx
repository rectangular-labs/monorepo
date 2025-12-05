"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerLabel,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@rectangular-labs/ui/components/ui/input-group";
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@rectangular-labs/ui/components/ui/sidebar";
import type { TreeChangeStatus, TreeFile } from "~/lib/campaign/build-tree";

export function ReviewSidebarList({
  summary,
  changedFiles,
  searchQuery,
  statusFilter,
  selectedItemId,
  onItemSelect,
  onStatusFilterChange,
  onSearchQueryChange,
}: {
  changedFiles: TreeFile[];
  summary: Record<TreeChangeStatus, number> & {
    total: number;
  };
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  statusFilter: "all" | TreeChangeStatus;
  onStatusFilterChange: (filter: "all" | TreeChangeStatus) => void;
  selectedItemId: TreeFile["treeId"] | null;
  onItemSelect: (itemId: TreeFile["treeId"]) => void;
}) {
  return (
    <SidebarGroupContent>
      <SidebarMenu className="gap-3 py-4">
        <SidebarMenuItem>
          <InputGroup className="w-full">
            <InputGroupAddon align="inline-start">
              <Icons.Search aria-hidden />
            </InputGroupAddon>
            <InputGroupInput
              onChange={(e) => onSearchQueryChange(e.target.value)}
              placeholder="Search files..."
              value={searchQuery}
            />
            <InputGroupAddon align="inline-end">
              <DropDrawer>
                <DropDrawerTrigger asChild>
                  <InputGroupButton size="icon-xs">
                    <Icons.Filter />
                  </InputGroupButton>
                </DropDrawerTrigger>
                <DropDrawerContent align="end">
                  <DropDrawerLabel>Filter by status</DropDrawerLabel>
                  <DropDrawerItem
                    className="flex flex-1 items-center justify-between font-medium"
                    onClick={() => {
                      onStatusFilterChange("all");
                    }}
                  >
                    All ({summary.total})
                    {statusFilter === "all" && (
                      <Icons.Check className="text-primary" />
                    )}
                  </DropDrawerItem>
                  <DropDrawerItem
                    className="flex flex-1 items-center justify-between font-medium"
                    onClick={() => {
                      onStatusFilterChange("created");
                    }}
                  >
                    Created ({summary.created})
                    {statusFilter === "created" && (
                      <Icons.Check className="text-primary" />
                    )}
                  </DropDrawerItem>
                  <DropDrawerItem
                    className="flex flex-1 items-center justify-between font-medium"
                    onClick={() => {
                      onStatusFilterChange("updated");
                    }}
                  >
                    Updated ({summary.updated})
                    {statusFilter === "updated" && (
                      <Icons.Check className="text-primary" />
                    )}
                  </DropDrawerItem>
                  <DropDrawerItem
                    className="flex flex-1 items-center justify-between font-medium"
                    onClick={() => {
                      onStatusFilterChange("deleted");
                    }}
                  >
                    Deleted ({summary.deleted})
                    {statusFilter === "deleted" && (
                      <Icons.Check className="text-primary" />
                    )}
                  </DropDrawerItem>
                </DropDrawerContent>
              </DropDrawer>
            </InputGroupAddon>
          </InputGroup>
        </SidebarMenuItem>
        {changedFiles.length > 0 && (
          <div className="flex flex-col gap-1">
            {changedFiles.map((item) => (
              <SidebarMenuItem key={item.treeId}>
                <SidebarMenuButton
                  isActive={selectedItemId === item.treeId}
                  onClick={() => onItemSelect(item.treeId)}
                  size="lg"
                >
                  <Icons.File />
                  <div className="flex min-w-0 flex-col items-start">
                    <span className="w-full truncate text-sm">{item.name}</span>
                    <span className="w-full truncate text-muted-foreground text-xs">
                      {item.path}
                    </span>
                  </div>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </div>
        )}
        {changedFiles.length === 0 && (
          <div className="px-4 py-3 text-center text-muted-foreground">
            <p className="text-sm">No files match the current filters.</p>
            <p className="text-xs">Try adjusting your filters and try again.</p>
          </div>
        )}
      </SidebarMenu>
    </SidebarGroupContent>
  );
}
