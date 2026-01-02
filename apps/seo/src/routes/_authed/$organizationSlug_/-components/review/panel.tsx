"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarProvider,
} from "@rectangular-labs/ui/components/ui/sidebar";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { strToU8, zipSync } from "fflate";
import { useEffect, useMemo, useRef, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import {
  type Tree,
  type TreeChangeStatus,
  type TreeFile,
  traverseTree,
} from "~/lib/workspace/build-tree";
import { TreeListDropDrawer, useTreeListMode } from "../tree-list-drop-drawer";
import { ReviewDiffView } from "./diff-viewer";
import { ReviewSidebarList } from "./sidebar-list";
import { ReviewTreeList } from "./tree-list";

export function ReviewPanel({
  tree,
  campaignId,
  projectId,
  organizationId,
}: {
  tree: Tree;
  campaignId: string;
  projectId: string;
  organizationId: string;
}) {
  const { data, refetch: refetchCampaign } = useQuery(
    getApiClientRq().campaigns.get.queryOptions({
      input: {
        id: campaignId,
        projectId,
        organizationId,
      },
    }),
  );

  const { mutate: updateCampaign, isPending: isUpdatingCampaign } = useMutation(
    getApiClientRq().campaigns.update.mutationOptions({
      onSuccess: async () => {
        await refetchCampaign();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    }),
  );

  const [layoutMode, setLayoutMode] = useTreeListMode();
  const [statusFilter, setStatusFilter] = useState<TreeChangeStatus | "all">(
    "all",
  );
  const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [selectedItemId, setSelectedItemId] = useState<
    TreeFile["treeId"] | null
  >(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Transform tree to review items
  const changedFiles = useMemo(() => {
    const items: TreeFile[] = [];

    traverseTree(tree, (node) => {
      if (node.changes && node.type === "file") {
        items.push(node);
      }
      return { shouldContinue: true };
    });

    return items;
  }, [tree]);

  // Calculate summary
  const summary = useMemo(() => {
    return changedFiles.reduce(
      (acc, item) => {
        ++acc.total;
        if (item.changes?.action === "created") ++acc.created;
        else if (item.changes?.action === "updated") ++acc.updated;
        else if (item.changes?.action === "deleted") ++acc.deleted;
        else if (item.changes?.action === "moved") ++acc.moved;
        return acc;
      },
      { total: 0, created: 0, updated: 0, deleted: 0, moved: 0 },
    );
  }, [changedFiles]);

  const filteredFiles = useMemo(() => {
    return changedFiles.filter((node) => {
      return (
        (statusFilter === "all" || node.changes?.action === statusFilter) &&
        node.name.toLowerCase().includes(searchQuery?.toLowerCase() ?? "")
      );
    });
  }, [changedFiles, statusFilter, searchQuery]);

  const downloadAllChangedContent = () => {
    if (changedFiles.length === 0) {
      toast.error("No changed files to download.");
      return;
    }

    if (isDownloading) return;

    setIsDownloading(true);
    try {
      const entries: Record<string, Uint8Array> = {};

      for (const file of changedFiles) {
        const rawPath = file.path.startsWith("/")
          ? file.path.slice(1)
          : file.path;
        const normalizedPath = rawPath.length > 0 ? rawPath : file.name;
        const zipPath =
          file.changes?.action === "deleted"
            ? `_deleted/${normalizedPath}`
            : normalizedPath;

        entries[zipPath] = strToU8(file.content.toString());
      }

      const zipped = zipSync(entries, { level: 6 });
      const blob = new Blob([new Uint8Array(zipped)], {
        type: "application/zip",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `campaign-${campaignId}-changes.zip`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      a.remove();

      // Give the browser a moment to start the download before revoking.
      setTimeout(() => URL.revokeObjectURL(url), 1_000);
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate download.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Refs for scrolling to selected file
  const fileRefs = useRef<Map<TreeFile["treeId"], HTMLDivElement>>(new Map());

  // Scroll to selected file when selection changes
  useEffect(() => {
    if (selectedItemId) {
      const element = fileRefs.current.get(selectedItemId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [selectedItemId]);

  return (
    <SidebarProvider className="h-full min-h-[calc(100vh-73px)] p-2">
      <Sidebar className="h-full rounded-md" collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <div className="flex items-center justify-between">
              <SidebarGroupLabel>Changed Files</SidebarGroupLabel>
              <TreeListDropDrawer onChange={setLayoutMode} value={layoutMode} />
            </div>
            {layoutMode === "tree" && (
              <ReviewTreeList
                onItemSelect={setSelectedItemId}
                onSearchQueryChange={setSearchQuery}
                onStatusFilterChange={setStatusFilter}
                searchQuery={searchQuery}
                statusFilter={statusFilter}
                summary={summary}
                tree={tree}
              />
            )}
            {layoutMode === "list" && (
              <ReviewSidebarList
                changedFiles={filteredFiles}
                onItemSelect={setSelectedItemId}
                onSearchQueryChange={setSearchQuery}
                onStatusFilterChange={setStatusFilter}
                searchQuery={searchQuery}
                selectedItemId={selectedItemId}
                statusFilter={statusFilter}
                summary={summary}
              />
            )}
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-y-auto">
        {data?.campaign.status === "draft" && (
          <div className="p-4 pb-0">
            <Alert>
              <Icons.Info className="size-4" />
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <AlertTitle>Campaign is in draft</AlertTitle>
                  <AlertDescription>
                    Mark it ready for review when you're ready to have your
                    changes reviewed.
                  </AlertDescription>
                </div>
                <Button
                  isLoading={isUpdatingCampaign}
                  onClick={() => {
                    updateCampaign({
                      id: campaignId,
                      projectId,
                      organizationId,
                      status: "review-requested",
                    });
                  }}
                  size="sm"
                >
                  Ready for review
                  <Icons.ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </Alert>
          </div>
        )}

        {/* Header with view mode toggle */}
        <div className="border-b p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-semibold text-lg">Review Changes</h2>
              <p className="text-muted-foreground text-sm">
                {summary.total} items changed: {summary.updated} updated,{" "}
                {summary.created} created, {summary.deleted} deleted
              </p>
            </div>
            <Button
              disabled={changedFiles.length === 0}
              isLoading={isDownloading}
              onClick={downloadAllChangedContent}
              size="sm"
              variant="outline"
            >
              Download all
              <Icons.Save aria-hidden="true" />
            </Button>
          </div>
        </div>

        {/* All files diff view */}
        <div className="flex-1 overflow-y-auto">
          {filteredFiles.length > 0 && (
            <div className="space-y-6 p-4">
              {filteredFiles.map((item) => (
                <div
                  className={
                    selectedItemId === item.treeId
                      ? "rounded-md ring-1 ring-primary ring-offset-4 ring-offset-background"
                      : ""
                  }
                  id={`file-${item.treeId}`}
                  key={item.treeId}
                  ref={(el) => {
                    if (el) {
                      fileRefs.current.set(item.treeId, el);
                    } else {
                      fileRefs.current.delete(item.treeId);
                    }
                  }}
                >
                  <ReviewDiffView file={item} viewMode={"track-changes"} />
                </div>
              ))}
            </div>
          )}
          {filteredFiles.length === 0 && (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No files match the current filters.
            </div>
          )}
        </div>
      </div>
    </SidebarProvider>
  );
}
