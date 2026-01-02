"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { useMutation, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
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
  const canAutoScheduleCadence =
    (publishingSettingsProject?.publishingSettings?.cadence?.allowedDays
      ?.length ?? 0) > 0;

  const treeResult = useMemo(() => {
    if (!loroDoc) return;
    return buildTree(loroDoc);
  }, [loroDoc]);
  const { plannerFiles } = useMemo(() => {
    const plannerFiles: TreeFile[] = [];
    if (!treeResult?.ok) return { plannerFiles };
    traverseTree(treeResult.value, (node) => {
      if (
        node.type === "file" &&
        (node.status === "queued" ||
          node.status === "suggested" ||
          node.status === "generating" ||
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
        onSuccess: () => {
          if (options?.closeDialog) {
            setActiveDialogTreeId(null);
          }
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
          const title = f.name.toLowerCase();
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
      title: f.name.replace(/\.md$/, ""),
      author: f.userId,
      createdAt: f.createdAt,
      scheduledFor: f.scheduledFor,
      primaryKeyword: f.primaryKeyword,
      status: f.status,
    }));
  }, [plannerFiles, normalizedSearch]);

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
                  console.log("file", file);
                  if (file.status === "suggested") {
                    return (
                      <div className="flex items-center gap-2">
                        <Button
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
        applyMetadataUpdate={applyMetadataUpdate}
        isSaving={isPushing}
        onOpenChange={(open) => {
          if (!open) setActiveDialogTreeId(null);
        }}
        open={!!activeDialogTreeId}
        publishingSettings={
          publishingSettingsProject?.publishingSettings ?? null
        }
      />
    </div>
  );
}
