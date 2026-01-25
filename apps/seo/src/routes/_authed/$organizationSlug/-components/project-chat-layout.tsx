"use client";

import {
  Drawer,
  DrawerContent,
} from "@rectangular-labs/ui/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@rectangular-labs/ui/components/ui/resizable";
import { useIsMobile } from "@rectangular-labs/ui/hooks/use-mobile";
import { ProjectChatPanel } from "./project-chat-panel";
import { useProjectChat } from "./project-chat-provider";

export function ProjectChatLayout({
  children,
  disable,
}: {
  children: React.ReactNode;
  disable: boolean;
}) {
  const { isOpen, close, open } = useProjectChat();
  const isMobile = useIsMobile();

  if (!isOpen || disable) {
    return <>{children}</>;
  }

  if (isMobile) {
    return (
      <>
        {children}
        <Drawer
          direction="right"
          onOpenChange={(next) => {
            if (next) open();
            else close();
          }}
          open={isOpen}
        >
          <DrawerContent className="p-0">
            <div className="h-full min-h-0">
              <ProjectChatPanel />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <ResizablePanelGroup
      className="h-full max-h-[calc(100vh-64px)] min-h-0 flex-1"
      direction="horizontal"
    >
      <ResizablePanel defaultSize={75} minSize={45}>
        {children}
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={25} maxSize={45} minSize={15}>
        <ProjectChatPanel />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
