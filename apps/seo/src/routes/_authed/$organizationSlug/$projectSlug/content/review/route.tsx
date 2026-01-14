"use client";

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
            Review outlines
          </NavLink>
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review/new-articles"
          >
            Review new articles
          </NavLink>
          <NavLink
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/content/review/article-updates"
          >
            Review article updates
          </NavLink>
        </nav>
      </div>
      <Outlet />
    </div>
  );
}
