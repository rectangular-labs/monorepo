"use client";

import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { NavLink } from "~/routes/_authed/-components/nav-link";
import { ArticleEditorTakeover } from "./-components/article-editor-takeover";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content",
)({
  validateSearch: type({
    "draftId?": "string.uuid",
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
  component: ContentLayout,
});

function ContentLayout() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { draftId } = Route.useSearch();
  const { projectId, organizationId } = Route.useLoaderData();
  const reviewCountsQuery = useQuery(
    getApiClientRq().content.getReviewCounts.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
      },
    }),
  );
  const reviewTotal = reviewCountsQuery.data?.total;

  if (draftId) {
    return (
      <div className="min-h-[calc(100vh-100px)] w-full">
        <ArticleEditorTakeover
          draftId={draftId}
          organizationId={organizationId}
          organizationSlug={organizationSlug}
          projectId={projectId}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-7xl flex-col md:flex-row">
      {/* 100px to account for the header */}
      <aside className="shrink-0 px-4 pt-6 md:sticky md:top-0 md:h-fit md:min-h-[calc(100vh-100px)] md:w-64 md:border-r">
        <div className="mb-4">
          <h2 className="font-semibold text-lg">Content</h2>
        </div>
        <nav className="flex flex-col gap-6 text-muted-foreground text-sm">
          <NavLink
            activeOptions={{ exact: true, includeSearch: false }}
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content"
          >
            Overview
          </NavLink>
          <NavLink
            activeOptions={{ exact: true, includeSearch: false }}
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/published"
          >
            Published
          </NavLink>
          <NavLink
            activeOptions={{ exact: true, includeSearch: false }}
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/scheduled"
          >
            Scheduled
          </NavLink>
          <NavLink
            activeOptions={{ exact: false, includeSearch: false }}
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review"
          >
            <span className="inline-flex items-center gap-2">
              Review
              {typeof reviewTotal === "number" && (
                <span className="rounded-full bg-muted px-2 py-0.5 text-foreground text-xs">
                  {reviewTotal}
                </span>
              )}
            </span>
          </NavLink>
        </nav>
      </aside>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
