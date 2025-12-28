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
import { ProjectChatPanel } from "./project-chat-panel";
import { useProjectChat } from "./project-chat-provider";

export function ProjectChatLayout({ children }: { children: React.ReactNode }) {
  const { isOpen, isDesktop, close, open } = useProjectChat();

  if (!isOpen) {
    return <>{children}</>;
  }

  if (isDesktop) {
    return (
      <ResizablePanelGroup
        className="h-full max-h-[calc(100vh-100px)] min-h-0 flex-1"
        direction="horizontal"
      >
        <ResizablePanel
          className="overflow-y-auto"
          defaultSize={70}
          minSize={45}
        >
          {children}
        </ResizablePanel>
        <ResizableHandle withHandle />
        <ResizablePanel defaultSize={30} maxSize={45} minSize={20}>
          <ProjectChatPanel />
        </ResizablePanel>
      </ResizablePanelGroup>
    );
  }

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
