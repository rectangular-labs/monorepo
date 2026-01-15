"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "../-components/articles-table";
import { useReviewRowActions } from "./-hook/use-review-row-actions";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/new-articles",
)({
  component: ReviewNewArticlesPage,
});

function ReviewNewArticlesPage() {
  const { organizationSlug } = Route.useParams();
  const { projectId } = useLoaderData({
    from: "/_authed/$organizationSlug/$projectSlug/content/review",
  });
  const navigate = Route.useNavigate();

  const newArticlesQuery = useQuery(
    getApiClientRq().content.listNewReviews.queryOptions({
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
    onMarked: newArticlesQuery.refetch,
  });

  return (
    <>
      <LoadingError
        className="p-6"
        error={newArticlesQuery.error}
        errorDescription="Something went wrong while loading new articles. Please try again."
        errorTitle="Error loading new articles"
        isLoading={newArticlesQuery.isLoading}
        onRetry={newArticlesQuery.refetch}
      />

      {!newArticlesQuery.isLoading && (
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
                onRowClick={(row) => {
                  navigate({
                    to: ".",
                    search: { draftId: row.id },
                  });
                }}
                rows={newArticlesQuery.data?.data ?? []}
              />
            </div>
          </section>
        </div>
      )}
    </>
  );
}
