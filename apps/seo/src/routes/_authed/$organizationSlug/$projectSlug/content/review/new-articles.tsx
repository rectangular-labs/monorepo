"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { useMemo } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "../-components/articles-table";
import {
  mapDraftToRow,
  useReviewRowActions,
} from "./-components/review-helpers";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/new-articles",
)({
  component: ReviewNewArticlesPage,
});

function ReviewNewArticlesPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { projectId, organizationId } = useLoaderData({
    from: "/_authed/$organizationSlug/$projectSlug/content/review",
  });
  const navigate = Route.useNavigate();

  const organizationMembersQuery = useQuery(
    getApiClientRq().auth.organization.members.queryOptions({
      input: {
        organizationIdentifier: organizationId,
      },
      enabled: !!organizationId,
    }),
  );

  const newArticlesQuery = useQuery(
    getApiClientRq().content.listNewReviews.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        limit: 50,
      },
    }),
  );

  const rows = useMemo(() => {
    return (newArticlesQuery.data?.data ?? []).map(mapDraftToRow);
  }, [newArticlesQuery.data?.data]);

  const { getRowActions } = useReviewRowActions({
    organizationSlug,
    projectId,
    onMarked: newArticlesQuery.refetch,
  });

  return (
    <>
      <LoadingError
        className="p-6"
        error={newArticlesQuery.error ?? organizationMembersQuery.error}
        errorDescription="Something went wrong while loading new articles. Please try again."
        errorTitle="Error loading new articles"
        isLoading={
          newArticlesQuery.isLoading || organizationMembersQuery.isLoading
        }
        onRetry={async () => {
          await Promise.all([
            newArticlesQuery.refetch(),
            organizationMembersQuery.refetch(),
          ]);
        }}
      />

      {!newArticlesQuery.isLoading &&
        !organizationMembersQuery.isLoading &&
        organizationMembersQuery.data && (
          <div className="flex-1 space-y-4 p-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Icons.FileText className="size-4 text-muted-foreground" />
                <h2 className="font-semibold text-base">
                  New articles to review
                </h2>
              </div>
              <div className="rounded-md border">
                <ArticlesTable
                  getRowActions={(row) => getRowActions(row)}
                  members={organizationMembersQuery.data.members}
                  onRowClick={(row) => {
                    navigate({
                      to: "/$organizationSlug/$projectSlug/content",
                      params: { organizationSlug, projectSlug },
                      search: { draftId: row.id },
                    });
                  }}
                  rows={rows}
                />
              </div>
            </section>
          </div>
        )}
    </>
  );
}
