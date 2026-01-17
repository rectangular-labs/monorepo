"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
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
  "/_authed/$organizationSlug/$projectSlug/content/scheduled",
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
  const { organizationSlug } = Route.useParams();
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

  const navigate = Route.useNavigate();
  const setViewMode = (next: "tree" | "list") => {
    setLayoutMode(next);
    navigate({
      search: (prev) => ({ ...prev, view: next }),
    });
  };

  const scheduledQuery = useQuery(
    getApiClientRq().content.listDrafts.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        status: ["scheduled"],
        isNew: null,
        limit: 20,
      },
    }),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const scheduledRows = useMemo(() => {
    const base = (scheduledQuery.data?.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      primaryKeyword: row.primaryKeyword,
      scheduledFor: row.scheduledFor,
      status: row.status,
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
  }, [normalizedSearch, scheduledQuery.data?.data]);

  const scheduledOverview = useMemo(() => {
    return (scheduledQuery.data?.data ?? []).slice(0, 5);
  }, [scheduledQuery.data?.data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b px-4 py-2 md:px-6">
        <h1 className="font-semibold text-lg">Scheduled content</h1>
      </div>

      <LoadingError
        className="p-6"
        error={scheduledQuery.error}
        errorDescription="Something went wrong while loading content. Please try again."
        errorTitle="Error loading content"
        isLoading={scheduledQuery.isLoading}
        onRetry={scheduledQuery.refetch}
      />

      {!scheduledQuery.isLoading && (
        <div className="flex-1 space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheduled content..."
                value={searchQuery}
              />
            </div>

            <div className="flex items-center gap-2">
              <TreeListDropDrawer onChange={setViewMode} value={activeView} />
            </div>
          </div>

          {scheduledOverview.length > 0 && (
            <div className="rounded-md border bg-background p-4 text-sm">
              <div className="mb-3 font-medium">Upcoming schedule</div>
              <div className="space-y-3">
                {scheduledOverview.map((row) => {
                  const dateLabel = row.scheduledFor
                    ? `Scheduled ${formatDate(row.scheduledFor)}`
                    : "Scheduled date unavailable";
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
              <ArticlesTable rows={scheduledRows} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
