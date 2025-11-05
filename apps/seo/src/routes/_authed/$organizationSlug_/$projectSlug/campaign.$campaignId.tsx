import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@rectangular-labs/ui/components/ui/resizable";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { CampaignHeader } from "~/routes/_authed/$organizationSlug_/-components/campaign-header";
import { CampaignsSidebar } from "~/routes/_authed/$organizationSlug_/-components/campaigns-sidebar";
import { ChatPanel } from "~/routes/_authed/$organizationSlug_/-components/chat-panel";

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
    await Promise.all([
      context.queryClient.ensureQueryData(
        getApiClientRq().campaign.get.queryOptions({
          input: {
            id: params.campaignId,
            projectId: activeProject.id,
            organizationId: activeProject.organizationId,
          },
        }),
      ),
      context.queryClient.ensureInfiniteQueryData(
        getApiClientRq().campaign.list.infiniteOptions({
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

    return { activeProject };
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
  const {
    data: { campaign },
  } = useSuspenseQuery(
    getApiClientRq().campaign.get.queryOptions({
      input: {
        id: campaignId,
        projectId: project.id,
        organizationId: project.organizationId,
      },
    }),
  );

  return (
    <div>
      <CampaignHeader
        campaignId={campaignId}
        initialTitle={campaign.title}
        organizationId={project.organizationId}
        projectId={project.id}
        projectWebsiteUrl={project.websiteUrl}
      />
      <Separator />
      <ResizablePanelGroup
        className="max-h-[calc(100vh-70px)] min-h-[calc(100vh-70px)]"
        direction="horizontal"
      >
        {/* Left sidebar */}
        <ResizablePanel
          className="bg-muted p-1"
          defaultSize={22}
          maxSize={30}
          minSize={15}
        >
          <CampaignsSidebar
            currentCampaign={campaign}
            organizationId={project?.organizationId ?? ""}
            projectId={project?.id ?? ""}
          />
        </ResizablePanel>
        <ResizableHandle withHandle />
        {/* Main workspace: chat for now */}
        <ResizablePanel className="bg-muted p-1" defaultSize={78} minSize={40}>
          <ChatPanel
            campaignId={campaignId}
            organizationId={project.organizationId}
            projectId={project.id}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
