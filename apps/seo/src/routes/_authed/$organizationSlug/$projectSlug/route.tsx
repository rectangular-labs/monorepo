import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { NavLink } from "../../-components/nav-link";

export const Route = createFileRoute("/_authed/$organizationSlug/$projectSlug")(
  {
    loader: async ({ context, params }) => {
      const activeProject = await context.queryClient.ensureQueryData(
        getApiClientRq().project.get.queryOptions({
          input: {
            organizationIdentifier: params.organizationSlug,
            identifier: params.projectSlug,
          },
        }),
      );
      if (!activeProject) throw notFound();

      if (!activeProject.workspaceBlobUri) {
        // Note, there's technically a possibility of a race condition here if multiple users are trying to access the new project at the same time.
        // Should be highly unlikely though, but just noting it here.
        await getApiClient().project.setUpWorkspace({
          projectId: activeProject.id,
          organizationIdentifier: params.organizationSlug,
        });
        await context.queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.get.queryKey({
            input: {
              organizationIdentifier: params.organizationSlug,
              identifier: params.projectSlug,
            },
          }),
        });
      }
    },
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();

  return (
    <div>
      <ul className="flex items-center gap-4 overflow-x-auto border-b px-4 pb-2 text-muted-foreground">
        <NavLink
          activeOptions={{
            exact: true,
          }}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug"
        >
          Overview
        </NavLink>
        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/calendar"
        >
          Calendar
        </NavLink>
        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/campaign"
        >
          Campaigns
        </NavLink>

        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/settings"
        >
          Settings
        </NavLink>
      </ul>

      <div className="mx-auto max-w-7xl">
        <Outlet />
      </div>
    </div>
  );
}
