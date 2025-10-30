import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Card } from "@rectangular-labs/ui/components/ui/card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@rectangular-labs/ui/components/ui/resizable";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/campaign/$campaignId",
)({
  loader: async ({ context, params }) => {
    const project = await context.queryClient.ensureQueryData(
      getApiClientRq().project.get.queryOptions({
        input: {
          organizationIdentifier: params.organizationSlug,
          identifier: params.projectSlug,
        },
      }),
    );
    if (!project) throw notFound();
    await context.queryClient.ensureQueryData(
      getApiClientRq().campaign.get.queryOptions({
        input: { id: params.campaignId, projectId: project.id },
      }),
    );
    return { project };
  },
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, campaignId } = Route.useParams();
  const { data: project } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const { data, isLoading, error, refetch } = useQuery(
    getApiClientRq().campaign.get.queryOptions({
      input: { id: campaignId, projectId: project?.id ?? "" },
      enabled: !!project?.id,
    }),
  );

  return (
    <div className="w-full p-4">
      <LoadingError
        error={error}
        errorDescription="We couldn't load this campaign. Please try again."
        errorTitle="Error loading campaign"
        isLoading={isLoading}
        onRetry={refetch}
      />

      {!isLoading && !error && data?.campaign && (
        <Card className="h-[calc(100vh-10rem)] p-0">
          <ResizablePanelGroup direction="horizontal">
            {/* Left sidebar */}
            <ResizablePanel
              className="border-r"
              defaultSize={20}
              maxSize={30}
              minSize={15}
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-3">
                  <div className="font-medium">Tools</div>
                </div>
                <div className="space-y-1 p-3">
                  <Button className="w-full justify-start" variant="ghost">
                    <Icons.Files className="mr-2 h-4 w-4" /> Files
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <Icons.Search className="mr-2 h-4 w-4" /> Search
                  </Button>
                  <Button className="w-full justify-start" variant="ghost">
                    <Icons.History className="mr-2 h-4 w-4" /> History
                  </Button>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />

            {/* Middle editor */}
            <ResizablePanel defaultSize={55} minSize={40}>
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b p-3">
                  <div className="truncate font-semibold">
                    {data.campaign.id}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline">
                      Review & Publish
                    </Button>
                    <Button size="sm">Chat</Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-3">
                  <Tabs className="w-full" defaultValue="meta">
                    <TabsList>
                      <TabsTrigger value="meta">Slug & meta</TabsTrigger>
                      <TabsTrigger value="targets">Targets</TabsTrigger>
                      <TabsTrigger value="history">File History</TabsTrigger>
                    </TabsList>
                    <TabsContent className="mt-4" value="meta">
                      <div className="space-y-3">
                        <Input placeholder="Title" />
                        <Input placeholder="Slug by Author" />
                        <Textarea placeholder="Description..." rows={10} />
                      </div>
                    </TabsContent>
                    <TabsContent className="mt-4" value="targets">
                      <div className="text-muted-foreground">
                        Targets UI TBD
                      </div>
                    </TabsContent>
                    <TabsContent className="mt-4" value="history">
                      <div className="text-muted-foreground">
                        History UI TBD
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />

            {/* Right chat */}
            <ResizablePanel
              className="border-l"
              defaultSize={25}
              maxSize={35}
              minSize={20}
            >
              <div className="flex h-full flex-col">
                <div className="border-b p-3 font-medium">Chat</div>
                <div className="flex-1 overflow-auto p-3">
                  <div className="rounded-md border p-3 text-muted-foreground text-sm">
                    Assistant responses will appear here.
                  </div>
                </div>
                <div className="border-t p-3">
                  <Textarea placeholder="Type a message" rows={3} />
                  <div className="mt-2 flex justify-end">
                    <Button size="sm">Send</Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </Card>
      )}
    </div>
  );
}
