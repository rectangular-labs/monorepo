"use client";

import { Response } from "@rectangular-labs/ui/components/ai-elements/response";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { useMemo } from "react";
import type { TreeChangeStatus, TreeFile } from "~/lib/workspace/build-tree";
import { generateDiffMarkdown } from "~/lib/workspace/generate-diff-markdown";

type ViewMode = "track-changes" | "side-by-side";

function ActionBadge({ action }: { action: TreeChangeStatus }) {
  switch (action) {
    case "created":
      return (
        <Badge variant="default">
          <Icons.Plus />
          Created
        </Badge>
      );
    case "updated":
      return (
        <Badge variant="secondary">
          <Icons.RefreshCcw />
          Updated
        </Badge>
      );
    case "deleted":
      return (
        <Badge variant="destructive">
          <Icons.CircleX />
          Deleted
        </Badge>
      );
    case "moved":
      return (
        <Badge variant="outline">
          <Icons.MoveRight />
          Moved
        </Badge>
      );
    default: {
      const _never: never = action;
      throw new Error(`Unknown action: ${_never}`);
    }
  }
}

function DiffTitle({ file }: { file: TreeFile }) {
  if (file.changes?.path && file.changes.action !== "created") {
    return (
      <span className="flex items-center gap-1 text-muted-foreground">
        <span className="line-through">{file.changes.path.old}</span>
        <Icons.ArrowRight className="size-3" />
        <span>{file.changes.path.new}</span>
      </span>
    );
  }
  if (file.changes?.action === "deleted") {
    return (
      <span className="text-muted-foreground line-through">{file.name}</span>
    );
  }
  return <span className="text-muted-foreground">{file.name}</span>;
}

function DiffAccordion({
  file,
  children,
}: {
  file: TreeFile;
  children: React.ReactNode;
}) {
  return (
    <Accordion
      className="h-full w-full rounded-md border"
      collapsible
      defaultValue="content"
      type="single"
    >
      <AccordionItem value="content">
        <AccordionTrigger
          className="group items-center p-0 hover:no-underline"
          hideChevron
        >
          <div className="flex w-full items-center justify-between px-2 py-3 group-data-[state=open]:border-b">
            <div className="flex items-center gap-2">
              <Icons.ChevronRight className="size-4 transition-transform duration-200 group-data-[state=open]:rotate-90" />
              <Icons.FileText className="size-3" />
              <DiffTitle file={file} />
            </div>
            {file.changes && <ActionBadge action={file.changes.action} />}
          </div>
        </AccordionTrigger>
        <AccordionContent className="p-2">{children}</AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

export function ReviewDiffView({
  file,
  viewMode,
}: {
  file: TreeFile;
  viewMode: ViewMode;
}) {
  const contentDiff = file.changes?.content;
  const hasContentChanges = !!contentDiff;

  const markdownDiffText = useMemo(() => {
    return generateDiffMarkdown(
      contentDiff?.old?.toString() ?? "",
      contentDiff?.diff ?? [],
    );
  }, [contentDiff]);

  if (viewMode === "track-changes") {
    return (
      <DiffAccordion file={file}>
        {hasContentChanges ? (
          <Response>{markdownDiffText}</Response>
        ) : (
          <div className="text-muted-foreground text-sm italic">
            No content changes detected
          </div>
        )}
      </DiffAccordion>
    );
  }

  // Side-by-side view
  return (
    <DiffAccordion file={file}>
      {hasContentChanges ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left: Before */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium text-sm">Before</span>
              <span className="text-muted-foreground text-xs">
                (
                {file.changes?.action === "created" ? "No content" : "Original"}
                )
              </span>
            </div>
            <div className="rounded-md border bg-muted/50 p-4">
              {file.changes?.action === "created" ? (
                <p className="text-muted-foreground text-sm italic">
                  New content item
                </p>
              ) : (
                <Response>{contentDiff?.old?.toString() ?? ""}</Response>
              )}
            </div>
          </div>

          {/* Right: After */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="font-medium text-sm">After</span>
              <span className="text-muted-foreground text-xs">
                ({file.changes?.action === "deleted" ? "Removed" : "Updated"})
              </span>
            </div>
            <div className="rounded-md border bg-muted/50 p-4">
              {file.changes?.action === "deleted" ? (
                <p className="text-muted-foreground text-sm italic">
                  Content removed
                </p>
              ) : (
                <Response>{file.content.toString()}</Response>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="text-muted-foreground text-sm italic">
          No content changes detected
        </div>
      )}
    </DiffAccordion>
  );
}
