import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@rectangular-labs/ui/components/ui/resizable";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { CampaignHeader } from "../-components/campaign-header";
import { CampaignsSidebar } from "../-components/campaigns-sidebar";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId",
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
    void Promise.all([
      context.queryClient.ensureQueryData(
        getApiClientRq().campaigns.get.queryOptions({
          input: {
            id: params.campaignId,
            projectId: activeProject.id,
            organizationId: activeProject.organizationId,
          },
        }),
      ),
      context.queryClient.ensureInfiniteQueryData(
        getApiClientRq().campaigns.list.infiniteOptions({
          input: (pageParam) => ({
            organizationId: activeProject.organizationId,
            projectId: activeProject.id,
            limit: 10,
            cursor: pageParam,
          }),
          initialPageParam: undefined as string | undefined,
          getNextPageParam: (lastPage) => lastPage.nextPageCursor,
        }),
      ),
    ]);
    return null;
  },
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
    <ResizablePanelGroup className="h-full" direction="horizontal">
      {/* Left sidebar */}
      <ResizablePanel
        className="bg-muted p-1"
        defaultSize={22}
        maxSize={30}
        minSize={15}
      >
        <CampaignsSidebar
          campaignId={campaignId}
          organizationId={project.organizationId}
          projectId={project.id}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel className="bg-muted p-1" defaultSize={78} minSize={40}>
        <CampaignHeader
          campaignId={campaignId}
          organizationId={project.organizationId}
          projectId={project.id}
          projectWebsiteUrl={project.websiteUrl}
        />
        <Separator />
        {/* The 73px comes from the header(64px) + separator (1px) + the general
        padding outside the chat (8px) */}
        <main className="h-full max-h-[calc(100vh-73px)] min-h-[calc(100vh-73px)] w-full rounded-b-md bg-background">
          <Outlet />
        </main>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
