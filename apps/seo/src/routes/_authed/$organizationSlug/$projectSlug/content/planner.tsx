"use client";

import type { SeoFileStatus } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/campaign/build-tree";
import { createPullDocumentQueryOptions } from "~/lib/campaign/sync";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "./-components/articles-table";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/planner",
)({
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
  component: PlannerPage,
});

function PlannerPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { projectId, organizationId } = Route.useLoaderData();
  const queryClient = Route.useRouteContext({ select: (s) => s.queryClient });
  const navigate = Route.useNavigate();

  const [searchQuery, setSearchQuery] = useState("");

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
    createPullDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
      queryClient,
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

  const normalizedSearch = searchQuery.trim().toLowerCase();

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
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Planner</h1>
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

      {treeResult?.ok && (
        <div className="flex-1 space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search planner items..."
                value={searchQuery}
              />
            </div>
          </div>

          <div className="rounded-md border">
            <ArticlesTable
              onRowClick={(row) => {
                const file = plannerFiles.find((f) => f.treeId === row.id);
                if (!file) return;
                navigate({
                  search: (prev) => ({ ...prev, file: file.path }),
                });
              }}
              rows={plannerRows}
            />
          </div>
        </div>
      )}
    </div>
  );
}
