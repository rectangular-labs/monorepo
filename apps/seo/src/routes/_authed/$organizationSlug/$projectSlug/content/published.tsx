"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useEffect, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "./-components/articles-table";
import {
  TreeListDropDrawer,
  useTreeListMode,
} from "./-components/tree-list-drop-drawer";

const formatDate = (value?: string | Date | null) => {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/published",
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
  const { projectId } = Route.useLoaderData();

  const [searchQuery, setSearchQuery] = useState("");

  const [layoutMode, setLayoutMode] = useTreeListMode();
  const activeView = view ?? layoutMode;

  useEffect(() => {
    if (view && view !== layoutMode) {
      setLayoutMode(view);
    }
  }, [layoutMode, setLayoutMode, view]);

  const setViewMode = (next: "tree" | "list") => {
    setLayoutMode(next);
  };

  const publishedQuery = useQuery(
    getApiClientRq().content.listPublished.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        limit: 20,
      },
    }),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const publishedRows = useMemo(() => {
    const base = (publishedQuery.data?.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      primaryKeyword: row.primaryKeyword,
      status: "published" as const,
    }));

    const filteredBySearch = normalizedSearch
      ? base.filter((row) => {
          return (
            row.slug.toLowerCase().includes(normalizedSearch) ||
            row.primaryKeyword.toLowerCase().includes(normalizedSearch) ||
            row.title.toLowerCase().includes(normalizedSearch)
          );
        })
      : base;

    return filteredBySearch;
  }, [normalizedSearch, publishedQuery.data?.data]);

  const publishedOverview = useMemo(() => {
    return (publishedQuery.data?.data ?? []).slice(0, 3);
  }, [publishedQuery.data?.data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Published content</h1>
            <p className="text-muted-foreground text-sm">{projectSlug}</p>
          </div>
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/content/review/outlines"
            >
              Review drafts
              <Icons.ArrowRight aria-hidden="true" className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
      </div>

      <LoadingError
        className="p-6"
        error={publishedQuery.error}
        errorDescription="Something went wrong while loading content. Please try again."
        errorTitle="Error loading content"
        isLoading={publishedQuery.isLoading}
        onRetry={publishedQuery.refetch}
      />

      {!publishedQuery.isLoading && (
        <div className="flex-1 space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search published content..."
                value={searchQuery}
              />
            </div>

            <div className="flex items-center gap-2">
              <TreeListDropDrawer onChange={setViewMode} value={activeView} />
            </div>
          </div>

          {publishedOverview.length > 0 && (
            <div className="rounded-md border bg-background p-4 text-sm">
              <div className="mb-3 font-medium">Recently published</div>
              <div className="space-y-3">
                {publishedOverview.map((row) => {
                  const dateLabel = row.publishedAt
                    ? `Published ${formatDate(row.publishedAt)}`
                    : "Published date unavailable";
                  return (
                    <div
                      className="flex flex-wrap items-center justify-between gap-3"
                      key={row.id}
                    >
                      <div className="min-w-0">
                        <div className="truncate font-medium">{row.title}</div>
                        <div className="text-muted-foreground">{row.slug}</div>
                      </div>
                      <div className="text-right text-muted-foreground text-xs">
                        <div>{dateLabel}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeView === "tree" ? (
            <div className="rounded-md border p-4 text-muted-foreground text-sm">
              Tree view coming soon. Use List view for now.
            </div>
          ) : (
            <div className="rounded-md border">
              <ArticlesTable rows={publishedRows} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
