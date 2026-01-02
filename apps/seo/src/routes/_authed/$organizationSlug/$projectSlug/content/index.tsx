"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useEffect, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/workspace/build-tree";
import { createPullDocumentQueryOptions } from "~/lib/workspace/sync";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "~/routes/_authed/$organizationSlug/$projectSlug/content/-components/articles-table";
import { ArticlesTree } from "~/routes/_authed/$organizationSlug/$projectSlug/content/-components/articles-tree";
import {
  TreeListDropDrawer,
  useTreeListMode,
} from "~/routes/_authed/$organizationSlug_/-components/tree-list-drop-drawer";
import { FilterStatus } from "./-components/filter-status";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/",
)({
  validateSearch: type({
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

    void context.queryClient.ensureQueryData(
      getApiClientRq().auth.organization.members.queryOptions({
        input: {
          organizationIdentifier: activeProject.organizationId,
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
  const { view } = Route.useSearch();
  const { projectId, organizationId } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [liveStatusFilter, setLiveStatusFilter] = useState<
    "all" | Extract<SeoFileStatus, "scheduled" | "published">
  >("all");

  const [layoutMode, setLayoutMode] = useTreeListMode();
  const activeView = view ?? layoutMode;

  useEffect(() => {
    if (view && view !== layoutMode) {
      setLayoutMode(view);
    }
  }, [layoutMode, setLayoutMode, view]);

  const setViewMode = (next: "tree" | "list") => {
    setLayoutMode(next);
    navigate({
      search: (prev) => ({ ...prev, view: next }),
    });
  };

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

  const { data: organizationMembers } = useQuery(
    getApiClientRq().auth.organization.members.queryOptions({
      input: {
        organizationIdentifier: organizationId,
      },
      enabled: !!organizationId,
    }),
  );

  const {
    data: loroDoc,
    error: loroDocError,
    isLoading: isLoadingLoroDoc,
    refetch: refetchLoroDoc,
  } = useQuery(
    createPullDocumentQueryOptions({
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

  const hasPlannerBacklog = useMemo(() => {
    return allFiles.some(
      (f) =>
        f.status === "queued" ||
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

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Scheduled & Published</h1>
            <p className="text-muted-foreground text-sm">
              {activeProject?.name ?? projectSlug}
            </p>
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
                    You have queued/suggested items or items pending review.
                    Visit the planner to triage and schedule.
                  </AlertDescription>
                </div>
                <Button asChild size="sm">
                  <Link
                    params={{ organizationSlug, projectSlug }}
                    to="/$organizationSlug/$projectSlug/content/planner"
                  >
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
                placeholder="Search published and scheduled articles..."
                value={searchQuery}
              />
            </div>

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
          </div>

          <div className="flex items-center justify-between">
            <p className="text-muted-foreground text-sm">
              {liveRows.length} articles
            </p>
            <TreeListDropDrawer onChange={setViewMode} value={activeView} />
          </div>

          {activeView === "tree" && (
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
                onFileSelect={(fileTreeId) => {
                  const file = liveFiles.find((f) => f.treeId === fileTreeId);
                  if (!file) return;
                  navigate({
                    search: (prev) => ({ ...prev, file: file.path }),
                  });
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

          {activeView === "list" && (
            <div className="rounded-md border">
              <ArticlesTable
                members={organizationMembers?.members ?? []}
                onRowClick={(row) => {
                  const file = liveFiles.find((f) => f.treeId === row.id);
                  if (!file) return;
                  navigate({
                    search: (prev) => ({ ...prev, file: file.path }),
                  });
                }}
                rows={liveRows}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
