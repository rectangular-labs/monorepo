"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { NavLink } from "~/routes/_authed/-components/nav-link";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/review",
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
  component: ReviewLayout,
});

function ReviewLayout() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { projectId } = Route.useLoaderData();
  const reviewCountsQuery = useQuery(
    getApiClientRq().content.getReviewCounts.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
      },
    }),
  );
  const reviewCounts = reviewCountsQuery.data;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b bg-background px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Review</h1>
            <p className="text-muted-foreground text-sm">{projectSlug}</p>
          </div>
        </div>
        <nav className="mt-4 flex flex-wrap gap-4 text-muted-foreground text-sm">
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review/outlines"
          >
            <span className="inline-flex items-center gap-2">
              Review outlines
              {typeof reviewCounts?.outlines === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground text-xs">
                  {reviewCounts.outlines}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review/new-articles"
          >
            <span className="inline-flex items-center gap-2">
              Review new articles
              {typeof reviewCounts?.newArticles === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground text-xs">
                  {reviewCounts.newArticles}
                </span>
              )}
            </span>
          </NavLink>
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review/article-updates"
          >
            <span className="inline-flex items-center gap-2">
              Review article updates
              {typeof reviewCounts?.articleUpdates === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground text-xs">
                  {reviewCounts.articleUpdates}
                </span>
              )}
            </span>
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
