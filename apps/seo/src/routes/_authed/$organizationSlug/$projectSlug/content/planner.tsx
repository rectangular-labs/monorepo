"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
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
import { ArticlesTable } from "./-components/articles-table";
import { PlannerDialogDrawer } from "./-components/planner-dialog-drawer";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/content/planner",
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

    void context.queryClient.ensureQueryData(
      getApiClientRq().auth.organization.members.queryOptions({
        input: {
          organizationIdentifier: activeProject.organizationId,
        },
      }),
    );

    return {
      projectId: activeProject.id,
      organizationId: activeProject.organizationId,
    };
  },
  component: PlannerPage,
});

function PlannerPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const { projectId, organizationId } = Route.useLoaderData();
  const navigate = Route.useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeDialogTreeId, setActiveDialogTreeId] = useState<string | null>(
    null,
  );
  const [retryingTreeIds, setRetryingTreeIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [regeneratingOutlineTreeIds, setRegeneratingOutlineTreeIds] = useState<
    Set<string>
  >(() => new Set());

  const {
    data: activeProject,
    isLoading: isLoadingProject,
    error: projectError,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data: publishingSettingsProject,
    error: publishingSettingsError,
    isLoading: isLoadingPublishingSettings,
    refetch: refetchPublishingSettings,
  } = useQuery(
    getApiClientRq().project.getPublishingSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
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

  const { data: organizationMembers } = useQuery(
    getApiClientRq().auth.organization.members.queryOptions({
      input: {
        organizationIdentifier: organizationId,
      },
      enabled: !!organizationId,
    }),
  );

  const { mutate: pushWorkspace, isPending: isPushing } = useMutation(
    createPushDocumentQueryOptions({
      organizationId,
      projectId,
      campaignId: null,
    }),
  );
  const { mutate: retryGeneration } = useMutation(
    getApiClientRq().task.create.mutationOptions({
      onError: () => {
        toast.error("Unable to retry article generation");
      },
    }),
  );
  const { mutate: regenerateOutline } = useMutation(
    getApiClientRq().task.create.mutationOptions({
      onError: () => {
        toast.error("Unable to regenerate outline");
      },
      onSuccess: () => {
        toast.success("Outline regeneration queued");
      },
    }),
  );
  const canAutoScheduleCadence =
    (publishingSettingsProject?.publishingSettings?.cadence?.allowedDays
      ?.length ?? 0) > 0;

  const treeResult = useMemo(() => {
    if (!loroDoc) return;
    return buildTree(loroDoc);
  }, [loroDoc]);

  const allFiles = useMemo(() => {
    if (!treeResult?.ok) return [];
    const files: TreeFile[] = [];
    traverseTree(treeResult.value, (node) => {
      if (node.type === "file") files.push(node);
      return { shouldContinue: true };
    });
    return files;
  }, [treeResult]);

  const { plannerFiles } = useMemo(() => {
    const plannerFiles: TreeFile[] = [];
    if (!treeResult?.ok) return { plannerFiles };
    traverseTree(treeResult.value, (node) => {
      if (
        node.type === "file" &&
        (node.status === "queued" ||
          node.status === "suggested" ||
          node.status === "generating" ||
          node.status === "generation-failed" ||
          node.status === "pending-review")
      ) {
        plannerFiles.push(node);
      }
      return { shouldContinue: true };
    });
    return { plannerFiles };
  }, [treeResult]);

  const activeDialogFile = useMemo(() => {
    if (!activeDialogTreeId) return undefined;
    return plannerFiles.find((f) => f.treeId === activeDialogTreeId);
  }, [activeDialogTreeId, plannerFiles]);

  const applyMetadataUpdate = (
    file: TreeFile,
    metadata: { key: string; value: string }[],
    options?: { closeDialog?: boolean },
  ) => {
    if (!loroDoc) return;
    if (metadata.length === 0) {
      if (options?.closeDialog) {
        setActiveDialogTreeId(null);
      }
      return;
    }
    pushWorkspace(
      {
        doc: loroDoc,
        operations: [{ path: file.path, metadata, createIfMissing: true }],
        context: {
          publishingSettings:
            publishingSettingsProject?.publishingSettings ?? null,
          // we don't need to set userId here because it'll get set on the backend
        },
      },
      {
        onSuccess: (_result, variables) => {
          if (options?.closeDialog) {
            setActiveDialogTreeId(null);
          }
          const statusMetadata = variables.operations.find((op) =>
            op.metadata?.find((m) => m.key === "status"),
          );
          const status = statusMetadata?.metadata?.find(
            (m) => m.key === "status",
          )?.value;
          const displayMessage = (() => {
            if (status === "queued") return "Article queued for generation";
            if (status === "suggestion-rejected")
              return "Article suggestion rejected";
            if (status === "review-denied") return "Article review denied";
            if (status === "scheduled") return "Article scheduled";
            return "Status updated.";
          })();
          toast.success(displayMessage);
        },
      },
    );
  };

  const handleSaveEdits = ({
    file,
    status,
    title,
    description,
    slug,
    notes,
    scheduledForIso,
    outline,
    options,
  }: {
    file: TreeFile;
    status?: SeoFileStatus;
    title: string;
    description: string;
    slug: string;
    notes: string;
    scheduledForIso: string | null;
    outline: string;
    options?: { closeDialog?: boolean };
  }) => {
    if (!loroDoc) return;

    const slugPathResult = slugToFilePath(slug);
    if (!slugPathResult.ok) {
      toast.error(slugPathResult.error.message);
      return;
    }

    let nextFilePath = file.path;
    if (slugPathResult.value !== file.path) {
      const collision = allFiles.find(
        (f) => f.path === slugPathResult.value && f.treeId !== file.treeId,
      );
      if (collision) {
        toast.error("Slug already exists");
        return;
      }

      const moveResult = moveFileToSlug({
        tree: loroDoc.getTree("fs"),
        fromFilePath: file.path,
        nextSlug: slug,
      });
      if (!moveResult.ok) {
        toast.error(moveResult.error.message);
        return;
      }
      nextFilePath = moveResult.value.nextFilePath;
    }

    const metadata: { key: string; value: string }[] = [
      { key: "title", value: title.trim() },
      { key: "description", value: description.trim() },
      { key: "notes", value: notes.trim() },
    ];
    if (status) metadata.push({ key: "status", value: status });
    if (scheduledForIso) {
      metadata.push({ key: "scheduledFor", value: scheduledForIso });
    }
    if (outline.trim())
      metadata.push({ key: "outline", value: outline.trim() });

    pushWorkspace(
      {
        doc: loroDoc,
        operations: [{ path: nextFilePath, metadata, createIfMissing: true }],
        context: {
          publishingSettings:
            publishingSettingsProject?.publishingSettings ?? null,
        },
      },
      {
        onSuccess: () => {
          if (options?.closeDialog) {
            setActiveDialogTreeId(null);
          }
          toast.success("Saved");
        },
      },
    );
  };

  const handleRetryGeneration = (file: TreeFile) => {
    if (!projectId || !organizationId) {
      toast.error("Unable to retry article generation");
      return;
    }
    if (retryingTreeIds.has(file.treeId)) return;
    setRetryingTreeIds((prev) => {
      const next = new Set(prev);
      next.add(file.treeId);
      return next;
    });
    retryGeneration(
      {
        type: "seo-write-article",
        projectId,
        organizationId,
        campaignId: null,
        path: file.path,
      },
      {
        onSuccess: (result) => {
          toast.success("Retrying article generation");
          applyMetadataUpdate(file, [
            { key: "status", value: "queued" },
            { key: "error", value: "" },
            { key: "workflowId", value: result.taskId },
          ]);
        },
        onSettled: () => {
          setRetryingTreeIds((prev) => {
            const next = new Set(prev);
            next.delete(file.treeId);
            return next;
          });
        },
      },
    );
  };

  const handleRegenerateOutline = (file: TreeFile) => {
    if (!projectId || !organizationId) {
      toast.error("Unable to regenerate outline");
      return;
    }
    if (regeneratingOutlineTreeIds.has(file.treeId)) return;
    setRegeneratingOutlineTreeIds((prev) => {
      const next = new Set(prev);
      next.add(file.treeId);
      return next;
    });
    regenerateOutline(
      {
        type: "seo-plan-keyword",
        projectId,
        organizationId,
        campaignId: null,
        path: file.path,
      },
      {
        onSettled: () => {
          setRegeneratingOutlineTreeIds((prev) => {
            const next = new Set(prev);
            next.delete(file.treeId);
            return next;
          });
        },
      },
    );
  };

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const plannerRows = useMemo(() => {
    const statusOrder: Record<SeoFileStatus, number> = {
      suggested: 0,
      queued: 1,
      generating: 2,
      "generation-failed": 3,
      "pending-review": 4,
      scheduled: 5,
      published: 6,
      "suggestion-rejected": 7,
      "review-denied": 8,
    };

    const filteredBySearch = normalizedSearch
      ? plannerFiles.filter((f) => {
          const title = (f.title ?? f.name.replace(/\.md$/, "")).toLowerCase();
          const keyword = f.primaryKeyword.toLowerCase();
          return (
            title.includes(normalizedSearch) ||
            keyword.includes(normalizedSearch)
          );
        })
      : plannerFiles;

    const sorted = [...filteredBySearch].sort((a, b) => {
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      const aTime = a.scheduledFor ? new Date(a.scheduledFor).getTime() : 0;
      const bTime = b.scheduledFor ? new Date(b.scheduledFor).getTime() : 0;
      return aTime - bTime;
    });

    return sorted.map((f) => ({
      id: f.treeId,
      slug: f.slug ?? f.path.replace(/\.md$/, ""),
      author: f.userId,
      createdAt: f.createdAt,
      scheduledFor: f.scheduledFor,
      primaryKeyword: f.primaryKeyword,
      status: f.status,
    }));
  }, [plannerFiles, normalizedSearch]);
  const isRegeneratingOutlineForActiveFile = Boolean(
    activeDialogTreeId && regeneratingOutlineTreeIds.has(activeDialogTreeId),
  );

  return (
    <div className="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div className="border-b p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="font-semibold text-lg">Planner</h1>
            <p className="text-muted-foreground text-sm">
              {activeProject?.name ?? projectSlug}
            </p>
          </div>
        </div>
      </div>

      <LoadingError
        className="p-6"
        error={
          projectError ??
          publishingSettingsError ??
          loroDocError ??
          (!treeResult?.ok ? (treeResult?.error ?? null) : null)
        }
        errorDescription="Something went wrong while loading content. Please try again."
        errorTitle="Error loading content"
        isLoading={
          isLoadingLoroDoc || isLoadingProject || isLoadingPublishingSettings
        }
        onRetry={async () => {
          await Promise.all([refetchLoroDoc(), refetchPublishingSettings()]);
        }}
      />
      {!isLoadingLoroDoc &&
        !isLoadingProject &&
        !isLoadingPublishingSettings &&
        treeResult?.ok && (
          <div className="flex-1 space-y-4 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative min-w-[260px] flex-1">
                <Icons.Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  className="h-10 w-full rounded-md border bg-background pr-3 pl-9 text-sm outline-none"
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search planner items..."
                  value={searchQuery}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <ArticlesTable
                getRowActions={(row) => {
                  const file = plannerFiles.find((f) => f.treeId === row.id);
                  if (!file) return null;
                  if (file.status === "suggested") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          isLoading={isPushing}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!canAutoScheduleCadence) {
                              setActiveDialogTreeId(file.treeId);
                              return;
                            }
                            applyMetadataUpdate(file, [
                              { key: "status", value: "queued" },
                            ]);
                          }}
                          size="sm"
                          type="button"
                        >
                          Accept
                        </Button>
                        <Button
                          isLoading={isPushing}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMetadataUpdate(file, [
                              { key: "status", value: "suggestion-rejected" },
                            ]);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Reject
                        </Button>
                      </div>
                    );
                  }
                  if (file.status === "pending-review") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          isLoading={isPushing}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMetadataUpdate(file, [
                              { key: "status", value: "scheduled" },
                            ]);
                          }}
                          size="sm"
                          type="button"
                        >
                          Approve
                        </Button>
                        <Button
                          isLoading={isPushing}
                          onClick={(e) => {
                            e.stopPropagation();
                            applyMetadataUpdate(file, [
                              { key: "status", value: "review-denied" },
                            ]);
                          }}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Deny
                        </Button>
                      </div>
                    );
                  }
                  if (file.status === "generation-failed") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button
                          isLoading={retryingTreeIds.has(file.treeId)}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRetryGeneration(file);
                          }}
                          size="sm"
                          type="button"
                        >
                          Retry
                        </Button>
                      </div>
                    );
                  }

                  return <span>-</span>;
                }}
                members={organizationMembers?.members ?? []}
                onRowClick={(row) => {
                  const file = plannerFiles.find((f) => f.treeId === row.id);
                  if (!file) return;
                  if (file.status === "suggested" || file.status === "queued") {
                    setActiveDialogTreeId(file.treeId);
                    return;
                  }
                  if (
                    file.status === "generating" ||
                    file.status === "pending-review"
                  ) {
                    navigate({
                      search: (prev) => ({ ...prev, file: file.path }),
                    });
                  }
                }}
                rows={plannerRows}
              />
            </div>
          </div>
        )}

      <PlannerDialogDrawer
        activeDialogFile={activeDialogFile}
        isRegeneratingOutline={isRegeneratingOutlineForActiveFile}
        isSaving={isPushing}
        onOpenChange={(open) => {
          if (!open) setActiveDialogTreeId(null);
        }}
        onRegenerateOutline={handleRegenerateOutline}
        onSaveEdits={handleSaveEdits}
        open={!!activeDialogTreeId}
        publishingSettings={
          publishingSettingsProject?.publishingSettings ?? null
        }
      />
    </div>
  );
}
