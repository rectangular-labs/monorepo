import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@rectangular-labs/ui/components/ui/resizable";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import {
  BetaUiProvider,
  useBetaUi,
} from "~/routes/_authed/-components/beta-ui-provider";
import { AppHeader } from "~/routes/_authed/$organizationSlug/-components/app-header";
import { BetaChatPanel } from "./-components/beta-chat-panel";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta",
)({
  component: BetaLayout,
});

function BetaLayout() {
  return (
    <BetaUiProvider>
      <BetaLayoutInner />
    </BetaUiProvider>
  );
}

function BetaLayoutInner() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { chatOpen } = useBetaUi();

  const autoSaveId = `seo-beta:panels:${organizationSlug}:${projectSlug}`;

  return (
    <>
      <AppHeader />
      <main className="flex w-full flex-1 flex-col bg-background">
        <ResizablePanelGroup
          autoSaveId={autoSaveId}
          className="h-full"
          direction="horizontal"
        >
          <ResizablePanel defaultSize={chatOpen ? 72 : 100} minSize={40}>
            <div className="h-full w-full">
              <Outlet />
            </div>
          </ResizablePanel>

          {chatOpen && (
            <>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={28} maxSize={45} minSize={20}>
                <BetaChatPanel />
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </main>
    </>
  );
}
