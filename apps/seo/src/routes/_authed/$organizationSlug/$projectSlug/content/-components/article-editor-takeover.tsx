"use client";

import { toSlug } from "@rectangular-labs/core/format/to-slug";
import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Button,
  buttonVariants,
} from "@rectangular-labs/ui/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@rectangular-labs/ui/components/ui/sheet";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { isoToDatetimeLocalValue } from "~/lib/datetime-local";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/workspace/build-tree";
import {
  createPullDocumentQueryOptions,
  createPushDocumentQueryOptions,
} from "~/lib/workspace/sync";
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

type SaveIndicatorState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: string }
  | { status: "saved-offline"; at: string }
  | { status: "error"; message: string };

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
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
  const navigate = Route.useNavigate();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicatorState>({
    status: "idle",
  });
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<{
    slug: string;
    status: SeoFileStatus;
    primaryKeyword: string;
    notes: string;
    scheduledFor: string;
  }>({
    slug: "",
    status: "queued",
    primaryKeyword: "",
    notes: "",
    scheduledFor: "",
  });
  const markdownSaveTimeoutRef = useRef<number | null>(null);
  const latestMarkdownRef = useRef<string>("");
  const pendingSyncRef = useRef(false);

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
    }),
  );

  const { data: publishingSettingsProject } = useQuery(
    getApiClientRq().project.getPublishingSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const publishingSettings =
    publishingSettingsProject?.publishingSettings ?? null;

  const { mutate: pushWorkspace, isPending: isPushing } = useMutation({
    ...createPushDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
    }),
    onSuccess: () => {
      pendingSyncRef.current = false;
      setIsMetadataOpen(false);
      setSaveIndicator({ status: "saved", at: new Date().toISOString() });
    },
    onError: (e) => {
      // The mutation writes to IDB before network push; if the network fails, we still consider it saved locally.
      pendingSyncRef.current = true;
      if (isOnline) {
        setSaveIndicator({
          status: "error",
          message: e instanceof Error ? e.message : "Failed to sync changes",
        });
      } else {
        setSaveIndicator({
          status: "saved-offline",
          at: new Date().toISOString(),
        });
      }
    },
  });

  const seoStatuses = [
    "suggested",
    "queued",
    "generating",
    "generation-failed",
    "pending-review",
    "scheduled",
    "published",
    "suggestion-rejected",
    "review-denied",
  ] as const satisfies readonly SeoFileStatus[];

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

  // When we come back online, push any pending offline edits.
  useEffect(() => {
    if (!isOnline) return;
    if (!loroDoc) return;
    if (!pendingSyncRef.current) return;
    if (isPushing) return;

    pushWorkspace({
      doc: loroDoc,
      operations: [],
      context: {
        publishingSettings,
      },
    });
  }, [isOnline, loroDoc, isPushing, pushWorkspace, publishingSettings]);

  // Keep metadata draft in sync with the selected file.
  useEffect(() => {
    if (!loroDoc) return;
    if (!fileNode?.ok) return;

    const fallbackSlug = toSlug(fileNode.value.name.replace(/\.md$/, ""));
    setMetadataDraft({
      slug: fallbackSlug,
      status: fileNode.value.status,
      primaryKeyword: fileNode.value.primaryKeyword,
      notes: fileNode.value.notes ?? "",
      scheduledFor: fileNode.value.scheduledFor
        ? isoToDatetimeLocalValue(fileNode.value.scheduledFor)
        : "",
    });
  }, [fileNode, loroDoc]);

  const onMarkdownChange = (nextMarkdown: string) => {
    latestMarkdownRef.current = nextMarkdown;
    if (markdownSaveTimeoutRef.current) {
      window.clearTimeout(markdownSaveTimeoutRef.current);
    }
    if (isReadOnly || !loroDoc || !fileNode?.ok) return;
    setSaveIndicator({ status: "saving" });
    markdownSaveTimeoutRef.current = window.setTimeout(() => {
      const content = latestMarkdownRef.current;

      pushWorkspace({
        doc: loroDoc,
        context: {
          publishingSettings,
        },
        operations: [
          {
            path: fileNode.value.path,
            content,
            createIfMissing: true,
          },
        ],
      });
    }, 800); // 800ms delay to prevent excessive calls to server
  };

  const onUploadImage = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const result = await getApiClient().project.uploadProjectImage({
      id: projectId,
      organizationIdentifier: organizationId,
      kind: "content-image",
      files: [{ name: file.name, url: dataUrl }],
    });
    // The API returns a public URL for `content-image`.
    const uri = result.publicUris[0];
    if (!uri) {
      throw new Error("Upload succeeded but returned no image URL");
    }
    return uri;
  };

  const saveMetadata = () => {
    if (!loroDoc) return;
    if (!fileNode?.ok) return;

    const nextScheduledIso = metadataDraft.scheduledFor
      ? new Date(metadataDraft.scheduledFor).toISOString()
      : "";

    const metadata: { key: string; value: string }[] = [
      { key: "status", value: metadataDraft.status },
      { key: "primaryKeyword", value: metadataDraft.primaryKeyword.trim() },
      { key: "notes", value: metadataDraft.notes.trim() },
      ...(nextScheduledIso
        ? [{ key: "scheduledFor", value: nextScheduledIso }]
        : []),
      ...(metadataDraft.slug.trim()
        ? [{ key: "slug", value: metadataDraft.slug.trim() }]
        : []),
    ];

    pushWorkspace({
      doc: loroDoc,
      context: {
        publishingSettings,
      },
      operations: [
        { path: fileNode.value.path, metadata, createIfMissing: true },
      ],
    });
  };

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex items-center justify-between gap-3 border-b bg-background px-4 py-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            search={(prev) => ({
              ...prev,
              file: undefined,
            })}
            to="."
          >
            <Icons.X className="size-4" />
            Close
          </Link>

          <div className="min-w-0">
            <p className="truncate font-medium text-sm">{title}</p>
            <p className="truncate text-muted-foreground text-xs">
              {workspaceFilePath}
              {isReadOnly ? " • Read-only (generating)" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          {fileNode?.ok && (
            <Button
              onClick={() => setIsMetadataOpen(true)}
              size="sm"
              variant="outline"
            >
              <Icons.Settings className="size-4" />
              Details
            </Button>
          )}

          <span className="inline-flex items-center gap-1">
            {saveIndicator.status === "saving" && (
              <>
                <Icons.Spinner className="size-3.5 animate-spin" />
                Saving…
              </>
            )}
            {saveIndicator.status === "saved" && (
              <>
                <Icons.Check className="size-3.5" />
                Synced {new Date(saveIndicator.at).toLocaleTimeString()}
              </>
            )}
            {saveIndicator.status === "saved-offline" && (
              <>
                <Icons.Save className="size-3.5" />
                Saved locally
              </>
            )}
            {saveIndicator.status === "error" && (
              <>
                <Icons.AlertTriangleIcon className="size-3.5" />
                Sync failed
              </>
            )}
          </span>

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
        error={
          loroDocError || (!fileNode?.ok ? (fileNode?.error ?? null) : null)
        }
        errorDescription="Something went wrong while loading this document. Please try again."
        errorTitle="Error loading document"
        isLoading={isLoadingLoroDoc}
        onRetry={refetchLoroDoc}
      />

      {fileNode?.ok && (
        <div className="flex flex-1 flex-col overflow-y-auto p-6">
          <style>
            {`
              @media (max-width: 768px) {
                .milkdown .ProseMirror {
                  padding: 8px 8px 8px 90px;
                }
              }
            `}
          </style>
          <MarkdownEditor
            key={`${workspaceFilePath}:${isReadOnly}`}
            markdown={fileNode.value.content.toString()}
            onMarkdownChange={onMarkdownChange}
            onUploadImage={onUploadImage}
            readOnly={isReadOnly}
          />
        </div>
      )}

      <Sheet onOpenChange={setIsMetadataOpen} open={isMetadataOpen}>
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Article settings</SheetTitle>
            <SheetDescription>
              Edit metadata like slug, keyword, status, and schedule.
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-auto p-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="article-slug">Slug</FieldLabel>
                <Input
                  id="article-slug"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                  placeholder="how-to-rank-on-google"
                  value={metadataDraft.slug}
                />
                <FieldDescription>
                  Optional URL slug for this article.
                </FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="article-primary-keyword">
                  Primary keyword
                </FieldLabel>
                <Input
                  id="article-primary-keyword"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      primaryKeyword: e.target.value,
                    }))
                  }
                  placeholder="best crm for startups"
                  value={metadataDraft.primaryKeyword}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="article-status">Status</FieldLabel>
                <Select
                  onValueChange={(value: (typeof seoStatuses)[number]) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      status: value,
                    }))
                  }
                  value={metadataDraft.status}
                >
                  <SelectTrigger id="article-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {seoStatuses.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="article-scheduled-for">
                  Scheduled for
                </FieldLabel>
                <Input
                  id="article-scheduled-for"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      scheduledFor: e.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={metadataDraft.scheduledFor}
                />
                <FieldDescription>Uses your local timezone.</FieldDescription>
              </Field>

              <Field>
                <FieldLabel htmlFor="article-notes">Notes</FieldLabel>
                <Textarea
                  id="article-notes"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                  placeholder="Optional notes for this article..."
                  rows={5}
                  value={metadataDraft.notes}
                />
              </Field>
            </FieldGroup>
          </div>

          <SheetFooter className="border-t">
            <Button disabled={isPushing || isReadOnly} onClick={saveMetadata}>
              Save settings
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
