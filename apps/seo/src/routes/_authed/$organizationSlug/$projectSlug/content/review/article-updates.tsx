"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { REVIEW_STATUSES } from "~/lib/workspace/review-statuses";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "../-components/articles-table";
import { useReviewRowActions } from "./-hook/use-review-row-actions";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/article-updates",
)({
  component: ReviewArticleUpdatesPage,
});

function ReviewArticleUpdatesPage() {
  const { organizationSlug } = Route.useParams();
  const { projectId } = useLoaderData({
    from: "/_authed/$organizationSlug/$projectSlug/content/review",
  });
  const navigate = Route.useNavigate();

  const updatesQuery = useQuery(
    getApiClientRq().content.listDrafts.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        status: REVIEW_STATUSES,
        isNew: false,
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
        error={updatesQuery.error}
        errorDescription="Something went wrong while loading updates. Please try again."
        errorTitle="Error loading updates"
        isLoading={updatesQuery.isLoading}
        onRetry={updatesQuery.refetch}
      />

      {!updatesQuery.isLoading && (
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
                onRowClick={(row) => {
                  navigate({
                    to: ".",
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
