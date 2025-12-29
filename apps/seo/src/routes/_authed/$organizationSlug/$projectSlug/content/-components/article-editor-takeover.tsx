"use client";

import { Crepe } from "@milkdown/crepe";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import type { SeoFileStatus } from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/campaign/build-tree";
import { createPullDocumentQueryOptions } from "~/lib/campaign/sync";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { Route } from "../route";

function normalizeWorkspaceFilePath(file: string) {
  const trimmed = file.trim();
  if (!trimmed) return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.endsWith(".md")
    ? withLeadingSlash
    : `${withLeadingSlash}.md`;
}

function MilkdownEditor({
  markdown,
  readOnly,
}: {
  markdown: string;
  readOnly: boolean;
}) {
  useEditor((root) => {
    const crepe = new Crepe({
      root,
      defaultValue: markdown,
    });
    crepe.setReadonly(readOnly);
    return crepe;
  });

  return <Milkdown />;
}

export function ArticleEditorTakeover({
  file,
  organizationSlug,
  projectSlug,
  organizationId,
  projectId,
}: {
  file: string;
  organizationSlug: string;
  projectSlug: string;
  organizationId: string;
  projectId: string;
}) {
  const queryClient = Route.useRouteContext({ select: (s) => s.queryClient });
  const navigate = Route.useNavigate();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  const workspaceFilePath = useMemo(
    () => normalizeWorkspaceFilePath(file),
    [file],
  );

  const {
    data: loroDoc,
    error: loroDocError,
    isLoading: isLoadingLoroDoc,
    refetch: refetchLoroDoc,
  } = useQuery(
    createPullDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
      queryClient,
    }),
  );

  const fileNode = useMemo(() => {
    if (!loroDoc) return;
    const treeResult = buildTree(loroDoc);
    if (!treeResult.ok) return treeResult;
    let found: TreeFile | undefined;
    traverseTree(treeResult.value, (node) => {
      if (node.type === "file" && node.path === workspaceFilePath) {
        found = node;
        return { shouldContinue: false };
      }
      return { shouldContinue: true };
    });
    if (!found) {
      return {
        ok: false as const,
        error: new Error(`File not found at ${workspaceFilePath}`),
      };
    }
    return { ok: true as const, value: found };
  }, [loroDoc, workspaceFilePath]);

  const title = fileNode?.ok
    ? fileNode.value.name.replace(/\.md$/, "")
    : "Editor";
  const status: SeoFileStatus | undefined = fileNode?.ok
    ? fileNode.value.status
    : undefined;

  const isReadOnly = status === "generating";

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Button
            onClick={() =>
              navigate({
                params: { organizationSlug, projectSlug },
                search: (prev) => ({ ...prev, file: undefined }),
              })
            }
            size="sm"
            variant="ghost"
          >
            <Icons.X className="size-4" />
            Close
          </Button>

          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{title}</p>
            <p className="truncate text-muted-foreground text-xs">
              {workspaceFilePath}
              {isReadOnly ? " • Read-only (generating)" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          {!isOnline && (
            <span className="inline-flex items-center gap-1">
              <Icons.AlertTriangleIcon className="size-3.5" />
              Offline
            </span>
          )}
        </div>
      </div>

      <LoadingError
        className="p-6"
        error={loroDocError}
        errorDescription="Something went wrong while loading this document. Please try again."
        errorTitle="Error loading document"
        isLoading={isLoadingLoroDoc}
        onRetry={refetchLoroDoc}
      />

      {!isLoadingLoroDoc && !loroDocError && fileNode && !fileNode.ok && (
        <LoadingError
          className="p-6"
          error={fileNode.error}
          errorTitle="File not found"
          isLoading={false}
        />
      )}

      {fileNode?.ok && (
        <div className="flex min-h-0 flex-1 flex-col p-6">
          <div className="min-h-0 flex-1 rounded-md border bg-background">
            <div className="h-full w-full overflow-auto p-4">
              <MilkdownProvider key={`${workspaceFilePath}:${isReadOnly}`}>
                <MilkdownEditor
                  markdown={fileNode.value.content.toString()}
                  readOnly={isReadOnly}
                />
              </MilkdownProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
