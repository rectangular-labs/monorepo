import { createFileRoute, notFound, Outlet } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { NavLink } from "../../-components/nav-link";
import { ProjectChatLayout } from "../-components/project-chat-layout";

export const Route = createFileRoute("/_authed/$organizationSlug/$projectSlug")(
  {
    loader: async ({ context, params }) => {
      const activeProject = await context.queryClient
        .ensureQueryData(
          getApiClientRq().project.get.queryOptions({
            input: {
              organizationIdentifier: params.organizationSlug,
              identifier: params.projectSlug,
            },
          }),
        )
        .catch((error) => {
          if (
            error instanceof Error &&
            error.message.includes("No project found")
          ) {
            return null;
          }
          throw error;
        });
      if (!activeProject) throw notFound();
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
          to="/$organizationSlug/$projectSlug/content"
        >
          Content
        </NavLink>

        <NavLink
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/settings"
        >
          Settings
        </NavLink>
      </ul>

      <ProjectChatLayout>
        {/* 100px to account for the header */}
        <div className="flex max-h-[calc(100vh-100px)] w-full justify-center overflow-y-auto">
          <Outlet />
        </div>
      </ProjectChatLayout>
    </div>
  );
}
