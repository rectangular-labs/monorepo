"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { type } from "arktype";
import { useEffect, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "./-components/articles-table";
import { FilterStatus } from "./-components/filter-status";
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

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | Extract<SeoFileStatus, "scheduled" | "published">
  >("all");

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

  const { data: organizationMembers } = useQuery(
    getApiClientRq().auth.organization.members.queryOptions({
      input: {
        organizationIdentifier: organizationId,
      },
      enabled: !!organizationId,
    }),
  );

  const liveQuery = useQuery(
    getApiClientRq().content.listLive.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        limit: 20,
      },
    }),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const liveRows = useMemo(() => {
    const base = (liveQuery.data?.data ?? []).map((row) => ({
      id: row.id,
      slug: row.slug,
      primaryKeyword: row.primaryKeyword,
      author: row.createdByUserId,
      scheduledFor: row.schedule.scheduledFor.toISOString(),
      status: row.schedule.status,
    }));

    const filteredByStatus =
      statusFilter === "all"
        ? base
        : base.filter((r) => r.status === statusFilter);

    const filteredBySearch = normalizedSearch
      ? filteredByStatus.filter((r) => {
          return (
            r.slug.toLowerCase().includes(normalizedSearch) ||
            r.primaryKeyword.toLowerCase().includes(normalizedSearch)
          );
        })
      : filteredByStatus;

    return filteredBySearch;
  }, [liveQuery.data?.data, normalizedSearch, statusFilter]);

  const counts = useMemo(() => {
    const data = liveQuery.data?.data ?? [];
    let scheduled = 0;
    let published = 0;
    for (const row of data) {
      if (row.schedule?.status === "scheduled") scheduled += 1;
      if (row.schedule?.status === "published") published += 1;
    }
    return { scheduled, published, total: data.length };
  }, [liveQuery.data?.data]);

  const liveOverview = useMemo(() => {
    return (liveQuery.data?.data ?? []).slice(0, 5);
  }, [liveQuery.data?.data]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Content</h1>
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
        error={liveQuery.error}
        errorDescription="Something went wrong while loading content. Please try again."
        errorTitle="Error loading content"
        isLoading={liveQuery.isLoading}
        onRetry={liveQuery.refetch}
      />

      {!liveQuery.isLoading && organizationMembers && (
        <div className="flex-1 space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="relative min-w-[260px] flex-1">
              <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search scheduled and published content..."
                value={searchQuery}
              />
            </div>

            <div className="flex items-center gap-2">
              <FilterStatus
                label="Filter by status"
                onChange={(next) => setStatusFilter(next)}
                options={[
                  { value: "all", label: "All", count: counts.total },
                  {
                    value: "scheduled",
                    label: "Scheduled",
                    count: counts.scheduled,
                  },
                  {
                    value: "published",
                    label: "Published",
                    count: counts.published,
                  },
                ]}
                value={statusFilter}
              >
                <Button size="sm" variant="outline">
                  <Icons.Filter className="mr-2 size-4" />
                  Filter
                </Button>
              </FilterStatus>

              <TreeListDropDrawer onChange={setViewMode} value={activeView} />
            </div>
          </div>

          {liveOverview.length > 0 && (
            <div className="rounded-md border bg-background p-4 text-sm">
              <div className="mb-3 font-medium">Live content</div>
              <div className="space-y-3">
                {liveOverview.map((row) => {
                  const status = row.schedule?.status ?? "scheduled";
                  const publishedAt = row.schedule?.publishedAt;
                  const scheduledFor = row.schedule?.scheduledFor;
                  const dateLabel = publishedAt
                    ? `Published ${formatDate(publishedAt)}`
                    : `Scheduled ${formatDate(scheduledFor)}`;
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
                        <div className="capitalize">{status}</div>
                        <div>{dateLabel}</div>
                        {row.schedule?.publishedUrl && (
                          <a
                            className="text-primary underline"
                            href={row.schedule.publishedUrl}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View
                          </a>
                        )}
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
              <ArticlesTable
                members={organizationMembers.members}
                rows={liveRows}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
