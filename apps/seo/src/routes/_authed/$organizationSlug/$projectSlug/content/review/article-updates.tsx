"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "../-components/articles-table";
import { useReviewRowActions } from "./-hook/use-review-row-actions";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/article-updates",
)({
  component: ReviewArticleUpdatesPage,
});

function ReviewArticleUpdatesPage() {
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

  const updatesQuery = useQuery(
    getApiClientRq().content.listUpdateReviews.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        limit: 50,
      },
    }),
  );

  const { getRowActions } = useReviewRowActions({
    organizationSlug,
    projectId,
    onMarked: updatesQuery.refetch,
  });

  return (
    <>
      <LoadingError
        className="p-6"
        error={updatesQuery.error ?? organizationMembersQuery.error}
        errorDescription="Something went wrong while loading updates. Please try again."
        errorTitle="Error loading updates"
        isLoading={updatesQuery.isLoading || organizationMembersQuery.isLoading}
        onRetry={async () => {
          await Promise.all([
            updatesQuery.refetch(),
            organizationMembersQuery.refetch(),
          ]);
        }}
      />

      {!updatesQuery.isLoading &&
        !organizationMembersQuery.isLoading &&
        organizationMembersQuery.data && (
          <div className="flex-1 space-y-4 p-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Icons.RefreshCcw className="size-4 text-muted-foreground" />
                <h2 className="font-semibold text-base">
                  Updated articles to review
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
                  rows={updatesQuery.data?.data ?? []}
                />
              </div>
            </section>
          </div>
        )}
    </>
  );
}
