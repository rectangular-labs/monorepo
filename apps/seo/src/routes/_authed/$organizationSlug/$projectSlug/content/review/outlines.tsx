"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ArticlesTable } from "../-components/articles-table";
import { useReviewRowActions } from "./-hook/use-review-row-actions";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review/outlines",
)({
  component: ReviewOutlinesPage,
});

function ReviewOutlinesPage() {
  const { organizationSlug } = Route.useParams();
  const { projectId } = useLoaderData({
    from: "/_authed/$organizationSlug/$projectSlug/content/review",
  });
  const navigate = Route.useNavigate();

  const outlinesQuery = useQuery(
    getApiClientRq().content.listSuggestions.queryOptions({
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
    onMarked: outlinesQuery.refetch,
  });

  return (
    <>
      <LoadingError
        className="p-6"
        error={outlinesQuery.error}
        errorDescription="Something went wrong while loading outlines. Please try again."
        errorTitle="Error loading outlines"
        isLoading={outlinesQuery.isLoading}
        onRetry={outlinesQuery.refetch}
      />

      {!outlinesQuery.isLoading && (
          <div className="flex-1 space-y-4 p-6">
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <Icons.Sparkles className="size-4 text-muted-foreground" />
                <h2 className="font-semibold text-base">
                  New article outlines
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
                  rows={outlinesQuery.data?.data ?? []}
                />
              </div>
            </section>
          </div>
        )}
    </>
  );
}
