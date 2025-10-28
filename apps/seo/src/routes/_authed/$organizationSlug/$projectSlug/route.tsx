import {
  createFileRoute,
  Link,
  notFound,
  Outlet,
} from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";

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
      return {
        activeProject,
      };
    },
    component: RouteComponent,
  },
);

function RouteComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const activeProps = {
    className:
      "text-foreground after:absolute after:bottom-[-8px] after:left-0 after:h-[2px] after:w-full after:bg-current after:content-['']",
  };
  const className = "relative transition-colors hover:text-foreground";

  return (
    <div>
      <ul className="flex items-center gap-4 overflow-x-auto border-b px-4 pb-2 text-muted-foreground">
        <Link
          activeOptions={{
            exact: true,
          }}
          activeProps={activeProps}
          className={className}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug"
        >
          Overview
        </Link>
        <Link
          activeProps={activeProps}
          className={className}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/content"
        >
          Content
        </Link>
        <Link
          activeProps={activeProps}
          className={className}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/calendar"
        >
          Calendar
        </Link>
        <Link
          activeProps={activeProps}
          className={className}
          params={{ organizationSlug, projectSlug }}
          to="/$organizationSlug/$projectSlug/settings"
        >
          Settings
        </Link>
      </ul>

      <main className="mx-auto max-w-7xl">
        <Outlet />
      </main>
    </div>
  );
}
