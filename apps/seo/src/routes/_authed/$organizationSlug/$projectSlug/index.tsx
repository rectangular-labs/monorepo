import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/",
)({
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { data: activeProject, isLoading: isLoadingActiveProject } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  if (isLoadingActiveProject) return <div>Loading...</div>;
  return (
    <div>
      <h1>Overview for {activeProject?.name}</h1>
      <p>This is the overview page for the project.</p>
    </div>
  );
}
