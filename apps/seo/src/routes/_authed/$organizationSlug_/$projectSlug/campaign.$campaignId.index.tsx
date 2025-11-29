import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { getApiClientRq } from "~/lib/api";

const ChatPanelLazy = lazy(() =>
  import("~/routes/_authed/$organizationSlug_/-components/chat-panel").then(
    (mod) => ({ default: mod.ChatPanel }),
  ),
);

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId/",
)({
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, campaignId } = Route.useParams();
  const { data: project } = useSuspenseQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  return (
    <Suspense fallback={null}>
      <ChatPanelLazy
        campaignId={campaignId}
        organizationId={project.organizationId}
        projectId={project.id}
      />
    </Suspense>
  );
}
