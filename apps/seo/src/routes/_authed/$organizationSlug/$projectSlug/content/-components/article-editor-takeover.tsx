"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Button,
  buttonVariants,
} from "@rectangular-labs/ui/components/ui/button";
import {
  Field,
  FieldContent,
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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { isoToDatetimeLocalValue } from "~/lib/datetime-local";
import {
  buildTree,
  type TreeFile,
  traverseTree,
} from "~/lib/workspace/build-tree";
import { moveFileToSlug, slugToFilePath } from "~/lib/workspace/slug";
import {
  createPullDocumentQueryOptions,
  createPushDocumentQueryOptions,
} from "~/lib/workspace/sync";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

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
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(() =>
    typeof navigator === "undefined" ? true : navigator.onLine,
  );
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicatorState>({
    status: "idle",
  });
  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [metadataDraft, setMetadataDraft] = useState<{
    title: string;
    description: string;
    slug: string;
    status: SeoFileStatus;
    primaryKeyword: string;
    notes: string;
    scheduledFor: string;
  }>({
    title: "",
    description: "",
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
    ? fileNode.value.title?.trim() || fileNode.value.name.replace(/\.md$/, "")
    : "Editor";
  const status: SeoFileStatus | undefined = fileNode?.ok
    ? fileNode.value.status
    : undefined;

  const isReadOnly = status === "generating";
  const outlineText = fileNode?.ok
    ? (fileNode.value.outline?.trim() ?? "")
    : "";

  const allFiles = useMemo(() => {
    if (!loroDoc) return [];
    const treeResult = buildTree(loroDoc);
    if (!treeResult.ok) return [];
    const files: TreeFile[] = [];
    traverseTree(treeResult.value, (node) => {
      if (node.type === "file") files.push(node);
      return { shouldContinue: true };
    });
    return files;
  }, [loroDoc]);

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

    setMetadataDraft({
      title: fileNode.value.title ?? fileNode.value.name.replace(/\.md$/, ""),
      description: fileNode.value.description ?? "",
      slug: fileNode.value.slug ?? fileNode.value.path.replace(/\.md$/, ""),
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

    const currentSlug =
      fileNode.value.slug ?? fileNode.value.path.replace(/\.md$/, "");
    const nextSlug = metadataDraft.slug.trim();
    const slugPathResult = slugToFilePath(nextSlug);
    if (!slugPathResult.ok) {
      toast.error(slugPathResult.error.message);
      return;
    }

    let nextFilePath = fileNode.value.path;
    if (nextSlug !== currentSlug) {
      const collision = allFiles.find(
        (f) =>
          f.path === slugPathResult.value && f.treeId !== fileNode.value.treeId,
      );
      if (collision) {
        toast.error("Slug already exists");
        return;
      }

      const moveResult = moveFileToSlug({
        tree: loroDoc.getTree("fs"),
        fromFilePath: fileNode.value.path,
        nextSlug,
      });
      if (!moveResult.ok) {
        toast.error(moveResult.error.message);
        return;
      }
      nextFilePath = moveResult.value.nextFilePath;
      void navigate({
        to: "/$organizationSlug/$projectSlug/content",
        params: { organizationSlug, projectSlug },
        search: (prev) => ({
          ...prev,
          file: nextFilePath,
        }),
      });
    }

    const metadata: { key: string; value: string }[] = [
      { key: "status", value: metadataDraft.status },
      { key: "title", value: metadataDraft.title.trim() },
      { key: "description", value: metadataDraft.description.trim() },
      { key: "primaryKeyword", value: metadataDraft.primaryKeyword.trim() },
      { key: "notes", value: metadataDraft.notes.trim() },
      ...(nextScheduledIso
        ? [{ key: "scheduledFor", value: nextScheduledIso }]
        : []),
    ];

    pushWorkspace({
      doc: loroDoc,
      context: {
        publishingSettings,
      },
      operations: [{ path: nextFilePath, metadata, createIfMissing: true }],
    });
  };

  const { mutate: regenerateOutline, isPending: isRegeneratingOutline } =
    useMutation(
      getApiClientRq().task.create.mutationOptions({
        onError: () => {
          toast.error("Unable to regenerate outline");
        },
        onSuccess: () => {
          toast.success("Outline regeneration queued");
        },
      }),
    );

  const { mutate: regenerateArticle, isPending: isRegeneratingArticle } =
    useMutation(
      getApiClientRq().task.create.mutationOptions({
        onError: () => {
          toast.error("Unable to regenerate article");
        },
        onSuccess: (result) => {
          toast.success("Article regeneration queued");
          if (!loroDoc) return;
          if (!fileNode?.ok) return;
          pushWorkspace({
            doc: loroDoc,
            context: {
              publishingSettings,
            },
            operations: [
              {
                path: fileNode.value.path,
                metadata: [
                  { key: "status", value: "queued" },
                  { key: "error", value: "" },
                  { key: "workflowId", value: result.taskId },
                ],
                createIfMissing: true,
              },
            ],
          });
        },
      }),
    );

  const handleRegenerateOutline = () => {
    if (!projectId || !organizationId) {
      toast.error("Unable to regenerate outline");
      return;
    }
    if (!fileNode?.ok) return;
    regenerateOutline({
      type: "seo-plan-keyword",
      projectId,
      organizationId,
      campaignId: null,
      path: fileNode.value.path,
    });
  };

  const handleRegenerateArticle = () => {
    if (!projectId || !organizationId) {
      toast.error("Unable to regenerate article");
      return;
    }
    if (!fileNode?.ok) return;
    regenerateArticle({
      type: "seo-write-article",
      projectId,
      organizationId,
      campaignId: null,
      path: fileNode.value.path,
    });
  };

  console.log("fileNode", fileNode);
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
          <div className="flex flex-1 flex-col gap-4">
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Outline</FieldLabel>
                <div className="flex items-center gap-2">
                  <Button
                    isLoading={isRegeneratingOutline}
                    onClick={handleRegenerateOutline}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Regenerate outline
                  </Button>
                  <Button
                    isLoading={isRegeneratingArticle}
                    onClick={handleRegenerateArticle}
                    size="sm"
                    type="button"
                    variant="ghost"
                  >
                    Regenerate article
                  </Button>
                </div>
              </div>
              {outlineText ? (
                <FieldContent className="p-0">
                  <Textarea
                    className="max-h-[28vh] min-h-[120px] resize-none"
                    readOnly
                    rows={8}
                    value={outlineText}
                  />
                </FieldContent>
              ) : (
                <FieldDescription className="text-muted-foreground text-sm">
                  No outline detected. Regenerate to populate with a plan.
                </FieldDescription>
              )}
            </Field>
            <div className="min-h-0 flex-1">
              <MarkdownEditor
                key={`${workspaceFilePath}:${isReadOnly}`}
                markdown={fileNode.value.content.toString()}
                onMarkdownChange={onMarkdownChange}
                onUploadImage={onUploadImage}
                readOnly={isReadOnly}
              />
            </div>
          </div>
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
                <FieldLabel htmlFor="article-title">Title</FieldLabel>
                <Input
                  id="article-title"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="How to rank on Google"
                  value={metadataDraft.title}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="article-description">
                  Description
                </FieldLabel>
                <Textarea
                  id="article-description"
                  onChange={(e) =>
                    setMetadataDraft((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Meta description..."
                  rows={3}
                  value={metadataDraft.description}
                />
              </Field>

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
                  placeholder="/how-to-rank-on-google"
                  value={metadataDraft.slug}
                />
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
            <Button disabled={isPushing} onClick={saveMetadata}>
              Save settings
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
