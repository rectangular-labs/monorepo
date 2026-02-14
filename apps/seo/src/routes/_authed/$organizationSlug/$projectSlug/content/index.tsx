"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import {
  ContentDetailsDrawer,
  type SnapshotMetric,
} from "../-components/content-details-drawer";
import {
  ContentTable,
  type ContentTableSortBy,
  type SortOrder,
} from "../-components/content-table";
import { useDownloadMutation } from "../-hooks/use-download-mutation";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/",
)({
  validateSearch: type({
    "sortBy?":
      "'clicks' | 'impressions' | 'ctr' | 'avgPosition' | 'title' | 'status' | 'strategy' | 'primaryKeyword'",
    "sortOrder?": "'asc' | 'desc'",
    "contentDraftId?": "string.uuid",
    "drawerMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
  }),
  head: ({ params }) => ({
    links: [
      {
        rel: "canonical",
        href: `/${params.organizationSlug}/${params.projectSlug}/content`,
      },
    ],
  }),
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { sortBy, sortOrder, contentDraftId, drawerMetric } = Route.useSearch();
  const navigate = Route.useNavigate();
  const api = getApiClientRq();
  const [selectedContentDraftId, setSelectedContentDraftId] = useState<
    string | null
  >(contentDraftId ?? null);

  const resolvedSortBy = (sortBy ?? null) as ContentTableSortBy | null;
  const resolvedSortOrder = (sortOrder ?? "desc") as SortOrder;
  const resolvedDrawerMetric = (drawerMetric ?? "clicks") as SnapshotMetric;

  const { data: activeProject } = useSuspenseQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const overviewQuery = useQuery(
    api.content.list.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
      },
      staleTime: 1000 * 60 * 10, // 10 minutes
      gcTime: 1000 * 60 * 60, // 1 hour
    }),
  );

  const downloadMutation = useDownloadMutation({
    organizationIdentifier: activeProject.organizationId,
    projectId: activeProject.id,
    projectSlug,
  });

  return (
    <Section className="w-full max-w-7xl space-y-4 py-4">
      <h1 className="font-semibold text-base">All content</h1>

      <LoadingError
        error={overviewQuery.error}
        errorDescription="Could not load content overview rows."
        errorTitle="Error loading content"
        isLoading={overviewQuery.isLoading}
        loadingComponent={<Icons.Spinner className="size-4 animate-spin" />}
        onRetry={overviewQuery.refetch}
      />

      {!overviewQuery.isLoading && !overviewQuery.error && (
        <ContentTable
          isDownloadingSelected={downloadMutation.isPending}
          onChangeSort={(nextSortBy) => {
            navigate({
              search: (prev) => ({
                ...prev,
                sortBy: nextSortBy ?? undefined,
              }),
              replace: true,
            });
          }}
          onChangeSortOrder={(nextSortOrder) => {
            navigate({
              search: (prev) => ({
                ...prev,
                sortOrder: nextSortOrder,
              }),
              replace: true,
            });
          }}
          onDownloadSelected={async (contentDraftIds) => {
            await downloadMutation.mutateAsync(contentDraftIds);
          }}
          onOpenContentDetails={(nextContentDraftId) => {
            setSelectedContentDraftId(nextContentDraftId);
            navigate({
              search: (prev) => ({
                ...prev,
                contentDraftId: nextContentDraftId,
              }),
              replace: true,
            });
          }}
          rows={overviewQuery.data?.rows ?? []}
          selectedContentDraftId={selectedContentDraftId}
          showRoleColumn={false}
          sortBy={resolvedSortBy}
          sortOrder={resolvedSortOrder}
        />
      )}

      <ContentDetailsDrawer
        contentDraftId={selectedContentDraftId}
        metric={resolvedDrawerMetric}
        onClose={() => {
          setSelectedContentDraftId(null);
          navigate({
            search: (prev) => ({
              ...prev,
              contentDraftId: undefined,
            }),
            replace: true,
          });
        }}
        onMetricChange={(nextMetric) => {
          navigate({
            search: (prev) => ({
              ...prev,
              drawerMetric: nextMetric,
            }),
            replace: true,
          });
        }}
        organizationIdentifier={activeProject.organizationId}
        projectId={activeProject.id}
      />
    </Section>
  );
}
