"use client";

import type { SeoFileStatus } from "@rectangular-labs/api-seo/types";
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
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@rectangular-labs/ui/components/ui/sidebar";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/campaign/build-tree";
import { createSyncDocumentQueryOptions } from "~/lib/campaign/sync";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "~/routes/_authed/$organizationSlug/$projectSlug/content/-components/articles-table";
import { ArticlesTree } from "~/routes/_authed/$organizationSlug/$projectSlug/content/-components/articles-tree";
import { FilterStatus } from "./-components/filter-status";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/",
)({
  validateSearch: type({
    "tab?": "'live'|'planner'",
    "view?": "'tree'|'list'",
  }),
  loader: async ({ context, params }) => {
    const activeProject = await context.queryClient.ensureQueryData(
      getApiClientRq().project.get.queryOptions({
        input: {
          organizationIdentifier: params.organizationSlug,
          identifier: params.projectSlug,
        },
      }),
    );

    return {
      projectId: activeProject.id,
      organizationId: activeProject.organizationId,
    };
  },
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { tab = "live", view = "tree" } = Route.useSearch();
  const { projectId, organizationId } = Route.useLoaderData();

  const [searchQuery, setSearchQuery] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState<
    "all" | Extract<SeoFileStatus, "scheduled" | "published">
  >("all");

  const {
    data: activeProject,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data: loroDoc,
    error: loroDocError,
    isLoading: isLoadingLoroDoc,
    refetch: refetchLoroDoc,
  } = useQuery(
    createSyncDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
    }),
  );

  const treeResult = useMemo(() => {
    if (!loroDoc) return;
    return buildTree(loroDoc);
  }, [loroDoc]);

  const allFiles = useMemo(() => {
    if (!treeResult?.ok) return [];
    const files: TreeFile[] = [];
    traverseTree(treeResult.value, (node) => {
      if (node.type === "file") files.push(node);
      return { shouldContinue: true };
    });
    return files;
  }, [treeResult]);

  const liveFiles = useMemo(
    () =>
      allFiles.filter(
        (f) => f.status === "scheduled" || f.status === "published",
      ),
    [allFiles],
  );
  const plannerFiles = useMemo(
    () =>
      allFiles.filter(
        (f) =>
          f.status === "planned" ||
          f.status === "suggested" ||
          f.status === "generating" ||
          f.status === "pending-review",
      ),
    [allFiles],
  );

  const hasPlannerBacklog = useMemo(() => {
    return allFiles.some(
      (f) =>
        f.status === "planned" ||
        f.status === "suggested" ||
        f.status === "pending-review",
    );
  }, [allFiles]);

  const liveCounts = useMemo(() => {
    return liveFiles.reduce(
      (acc, file) => {
        acc.total += 1;
        if (file.status === "scheduled") acc.scheduled += 1;
        if (file.status === "published") acc.published += 1;
        return acc;
      },
      { total: 0, scheduled: 0, published: 0 },
    );
  }, [liveFiles]);

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const liveRows = useMemo(() => {
    const filteredByStatus = liveFiles.filter((f) => {
      if (liveStatusFilter === "all") return true;
      return f.status === liveStatusFilter;
    });
    const filteredBySearch = normalizedSearch
      ? filteredByStatus.filter((f) => {
          const title = f.name.toLowerCase();
          const keyword = f.primaryKeyword.toLowerCase();
          return (
            title.includes(normalizedSearch) ||
            keyword.includes(normalizedSearch)
          );
        })
      : filteredByStatus;

    return filteredBySearch.map((f) => ({
      id: f.treeId,
      title: f.name.replace(/\.md$/, ""),
      author: f.userId,
      createdAt: f.createdAt,
      scheduledFor: f.scheduledFor,
      primaryKeyword: f.primaryKeyword,
      status: f.status,
    }));
  }, [liveFiles, liveStatusFilter, normalizedSearch]);

  const plannerRows = useMemo(() => {
    const statusOrder: Record<SeoFileStatus, number> = {
      suggested: 0,
      planned: 1,
      generating: 2,
      "pending-review": 3,
      scheduled: 4,
      published: 5,
      "suggestion-rejected": 6,
      "review-denied": 7,
    };
    const filteredBySearch = normalizedSearch
      ? plannerFiles.filter((f) => {
          const title = f.name.toLowerCase();
          const keyword = f.primaryKeyword.toLowerCase();
          return (
            title.includes(normalizedSearch) ||
            keyword.includes(normalizedSearch)
          );
        })
      : plannerFiles;

    const sorted = [...filteredBySearch].sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      const aTime = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const bTime = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return aTime - bTime;
    });

    return sorted.map((f) => ({
      id: f.treeId,
      title: f.name.replace(/\.md$/, ""),
      author: f.userId,
      createdAt: f.createdAt,
      scheduledFor: f.scheduledFor,
      primaryKeyword: f.primaryKeyword,
      status: f.status,
    }));
  }, [plannerFiles, normalizedSearch]);

  return (
    <SidebarProvider className="h-full min-h-[calc(100vh-73px)] p-2">
      <Sidebar className="h-full rounded-md" collapsible="none">
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Content</SidebarGroupLabel>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={tab === "live"}>
                  <Link search={{ tab: "live" as const }} to=".">
                    <Icons.FileText />
                    Scheduled & Published
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={tab === "planner"}>
                  <Link search={{ tab: "planner" as const }} to=".">
                    <Icons.Timer />
                    Planner
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-semibold text-lg">
                {tab === "planner" ? "Planner" : "Scheduled & Published"}
              </h1>
              <p className="text-muted-foreground text-sm">
                {activeProject?.name ?? projectSlug}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild size="sm" variant="outline">
                <Link
                  params={{ organizationSlug, projectSlug }}
                  to="/$organizationSlug/$projectSlug/settings"
                >
                  <Icons.Settings className="size-4" />
                  Project settings
                </Link>
              </Button>
            </div>
          </div>
        </div>

        <LoadingError
          className="p-6"
          error={loroDocError || projectError}
          errorDescription="Something went wrong while loading content. Please try again."
          errorTitle="Error loading content"
          isLoading={isLoadingLoroDoc || isLoadingProject}
          onRetry={refetchLoroDoc}
        />

        {!isLoadingLoroDoc && !loroDocError && treeResult && !treeResult.ok && (
          <LoadingError
            className="p-6"
            error={treeResult.error}
            errorTitle="Error loading workspace"
            isLoading={false}
          />
        )}

        {!isLoadingLoroDoc &&
          !loroDocError &&
          treeResult?.ok &&
          tab === "live" &&
          hasPlannerBacklog && (
            <div className="p-6 pb-0">
              <Alert>
                <Icons.Info className="size-4" />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <AlertTitle>
                      There are items waiting in your planner
                    </AlertTitle>
                    <AlertDescription>
                      You have planned/suggested items or items pending review.
                      Visit the planner to triage and schedule.
                    </AlertDescription>
                  </div>
                  <Button asChild size="sm">
                    <Link search={{ tab: "planner" as const }} to=".">
                      Go to planner
                      <Icons.ArrowRight aria-hidden="true" />
                    </Link>
                  </Button>
                </div>
              </Alert>
            </div>
          )}

        {treeResult?.ok && (
          <div className="flex-1 space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[260px] flex-1">
                <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={
                    tab === "planner"
                      ? "Search planner items..."
                      : "Search published and scheduled articles..."
                  }
                  value={searchQuery}
                />
              </div>

              {tab === "live" && (
                <FilterStatus<Extract<SeoFileStatus, "scheduled" | "published">>
                  label="Status"
                  onChange={(value) => setLiveStatusFilter(value)}
                  options={[
                    { value: "all", label: "All", count: liveCounts.total },
                    {
                      value: "scheduled",
                      label: "Scheduled",
                      count: liveCounts.scheduled,
                    },
                    {
                      value: "published",
                      label: "Published",
                      count: liveCounts.published,
                    },
                  ]}
                  value={liveStatusFilter}
                >
                  <Button size="sm" variant="outline">
                    <Icons.Filter className="size-4" />
                    Filter
                  </Button>
                </FilterStatus>
              )}
            </div>

            {tab === "live" && (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-muted-foreground text-sm">
                    {liveRows.length} articles
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      asChild
                      size="sm"
                      variant={view === "tree" ? "default" : "outline"}
                    >
                      <Link search={{ view: "tree" as const }} to=".">
                        <Icons.ListTree className="size-4" />
                        Tree
                      </Link>
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      variant={view === "list" ? "default" : "outline"}
                    >
                      <Link search={{ view: "list" as const }} to=".">
                        <Icons.List className="size-4" />
                        List
                      </Link>
                    </Button>
                  </div>
                </div>

                {view === "tree" && (
                  <div className="rounded-md border p-3">
                    <ArticlesTree
                      includeFile={(file, filter) => {
                        if (
                          file.status !== "scheduled" &&
                          file.status !== "published"
                        ) {
                          return false;
                        }
                        if (filter === "all") return true;
                        return file.status === filter;
                      }}
                      onFileSelect={() => {
                        // stage 3: open editor takeover
                      }}
                      statusFilter={
                        liveStatusFilter === "all"
                          ? "all"
                          : (liveStatusFilter as SeoFileStatus)
                      }
                      tree={treeResult.value}
                    />
                  </div>
                )}

                {view === "list" && (
                  <div className="rounded-md border">
                    <ArticlesTable
                      onRowClick={() => {
                        // stage 3: open editor takeover
                      }}
                      rows={liveRows}
                    />
                  </div>
                )}
              </>
            )}

            {tab === "planner" && (
              <div className="rounded-md border">
                <ArticlesTable
                  onRowClick={() => {
                    // stage 6: open dialog-drawer / editor depending on status
                  }}
                  rows={plannerRows}
                />
              </div>
            )}
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
