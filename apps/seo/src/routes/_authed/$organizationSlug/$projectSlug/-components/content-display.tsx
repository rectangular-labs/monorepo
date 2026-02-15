import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { formatNullableCurrency } from "@rectangular-labs/core/format/currency";
import { formatNullableNumber } from "@rectangular-labs/core/format/number";
import {
  formatNullablePercent,
  formatNullableSignedPercent,
} from "@rectangular-labs/core/format/percent";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  DialogDrawer,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import { PopoverTooltip } from "@rectangular-labs/ui/components/ui/popover-tooltip";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ManageContentMetadataDialog } from "./manage-content-metadata-dialog";
import {
  type SnapshotMetric,
  SnapshotTrendChart,
} from "./snapshot-trend-chart";
import { TopKeywords, type TopKeywordsSortOrder } from "./top-keywords";

export function useContentDisplayController({
  draftId,
  organizationIdentifier,
  projectId,
}: {
  draftId: string | null;
  organizationIdentifier: string;
  projectId: string;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const hasDraft = !!draftId;

  const contentDetailsQuery = useQuery(
    api.content.getDraftDetails.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
        id: draftId ?? "00000000-0000-0000-0000-000000000000",
        months: 3,
      },
      enabled: hasDraft,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
      refetchInterval: (context) => {
        const draft = context.state.data?.contentDraft;
        if (
          draft?.status === "queued" ||
          draft?.status === "planning" ||
          draft?.status === "writing" ||
          draft?.status === "reviewing-writing"
        ) {
          return 8_000;
        }
        return false;
      },
    }),
  );

  const details = contentDetailsQuery.data;
  const topKeywords = details?.metricSnapshot?.topKeywords ?? [];
  const draft = details?.contentDraft;

  const { data: generatingOutlineStatusData } = useQuery(
    api.task.getStatus.queryOptions({
      input: { id: draft?.outlineGeneratedByTaskRunId ?? "" },
      enabled: hasDraft && !!draft?.outlineGeneratedByTaskRunId,
      refetchInterval: (context) => {
        const task = context.state.data;
        if (
          task?.status === "pending" ||
          task?.status === "queued" ||
          task?.status === "running"
        ) {
          return 8_000;
        }
        return false;
      },
    }),
  );

  const { data: generatingArticleStatusData } = useQuery(
    api.task.getStatus.queryOptions({
      input: { id: draft?.generatedByTaskRunId ?? "" },
      enabled: hasDraft && !!draft?.generatedByTaskRunId,
      refetchInterval: (context) => {
        const task = context.state.data;
        if (
          task?.status === "pending" ||
          task?.status === "queued" ||
          task?.status === "running"
        ) {
          return 8_000;
        }
        return false;
      },
    }),
  );

  const isGeneratingOutline =
    !!draft?.outlineGeneratedByTaskRunId &&
    (generatingOutlineStatusData?.status === "pending" ||
      generatingOutlineStatusData?.status === "running" ||
      generatingOutlineStatusData?.status === "queued");

  const isGeneratingArticle =
    !!draft?.generatedByTaskRunId &&
    (generatingArticleStatusData?.status === "pending" ||
      generatingArticleStatusData?.status === "running" ||
      generatingArticleStatusData?.status === "queued");

  const isGenerating = isGeneratingOutline || isGeneratingArticle;
  const canEdit = !!draft && !isGenerating;

  const [isMetadataOpen, setIsMetadataOpen] = useState(false);
  const [isRegenerateOutlineOpen, setIsRegenerateOutlineOpen] = useState(false);
  const [isRegenerateArticleOpen, setIsRegenerateArticleOpen] = useState(false);
  const [contentSaveIndicator, setContentSaveIndicator] = useState<
    { status: "idle" } | { status: "saving" } | { status: "saved"; at: string }
  >({ status: "idle" });
  const [lastSavedContentMarkdown, setLastSavedContentMarkdown] = useState("");
  const latestSaveVersionRef = useRef(0);
  const latestAppliedSaveVersionRef = useRef(0);

  const [draftDetails, setDraftDetails] = useState({
    contentMarkdown: "",
  });

  const { mutateAsync: updateDraftAsync, isPending } = useMutation(
    api.content.updateDraft.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        await Promise.all([
          contentDetailsQuery.refetch(),
          queryClient.invalidateQueries({
            queryKey: api.content.list.queryKey({
              input: {
                organizationIdentifier,
                projectId,
              },
            }),
          }),
        ]);
      },
    }),
  );

  const { mutateAsync: saveContentMarkdownAsync } = useMutation(
    api.content.updateDraft.mutationOptions({
      onError: () => {
        toast.error("Failed to auto-save content.");
      },
    }),
  );

  useEffect(() => {
    if (!draft) {
      setContentSaveIndicator({ status: "idle" });
      setLastSavedContentMarkdown("");
      return;
    }
    setDraftDetails({
      contentMarkdown: draft.contentMarkdown ?? "",
    });
    setLastSavedContentMarkdown(draft.contentMarkdown ?? "");
    setContentSaveIndicator({
      status: "saved",
      at: new Date(draft.updatedAt).toISOString(),
    });
    latestSaveVersionRef.current = 0;
    latestAppliedSaveVersionRef.current = 0;
  }, [draft]);

  useEffect(() => {
    if (!draft || !canEdit) return;
    if (draftDetails.contentMarkdown === lastSavedContentMarkdown) return;

    setContentSaveIndicator({ status: "saving" });
    const timeoutId = window.setTimeout(() => {
      const saveVersion = ++latestSaveVersionRef.current;
      const markdownToSave = draftDetails.contentMarkdown;

      void saveContentMarkdownAsync({
        organizationIdentifier,
        projectId,
        id: draft.id,
        contentMarkdown: markdownToSave,
      })
        .then(() => {
          if (saveVersion < latestAppliedSaveVersionRef.current) return;
          latestAppliedSaveVersionRef.current = saveVersion;
          setLastSavedContentMarkdown(markdownToSave);
          setContentSaveIndicator({
            status: "saved",
            at: new Date().toISOString(),
          });
        })
        .catch(() => {
          if (saveVersion < latestAppliedSaveVersionRef.current) return;
          setContentSaveIndicator({ status: "idle" });
        });
    }, 800);

    return () => window.clearTimeout(timeoutId);
  }, [
    canEdit,
    draft,
    draftDetails.contentMarkdown,
    lastSavedContentMarkdown,
    organizationIdentifier,
    projectId,
    saveContentMarkdownAsync,
  ]);

  const handleRegenerateOutline = async () => {
    if (!draft) return;
    try {
      await updateDraftAsync({
        organizationIdentifier,
        projectId,
        id: draft.id,
        outlineGeneratedByTaskRunId: null,
      });
      setIsRegenerateOutlineOpen(false);
      toast.success("Outline regeneration started");
    } catch {
      // mutation error handled via onError
    }
  };

  const handleRegenerateArticle = async () => {
    if (!draft) return;
    try {
      await updateDraftAsync({
        organizationIdentifier,
        projectId,
        id: draft.id,
        status: "queued",
        generatedByTaskRunId: null,
      });
      setIsRegenerateArticleOpen(false);
      toast.success("Article regeneration started");
    } catch {
      // mutation error handled via onError
    }
  };

  return {
    canEdit,
    contentDetailsQuery,
    contentSaveIndicator,
    details,
    draft,
    draftDetails,
    handleRegenerateArticle,
    handleRegenerateOutline,
    isGenerating,
    isGeneratingArticle,
    isGeneratingOutline,
    isMetadataOpen,
    isPending,
    isRegenerateArticleOpen,
    isRegenerateOutlineOpen,
    organizationIdentifier,
    projectId,
    setDraftDetails,
    setIsMetadataOpen,
    setIsRegenerateArticleOpen,
    setIsRegenerateOutlineOpen,
    topKeywords,
  };
}

export function ContentDisplay({
  controller,
  headerActions,
}: {
  controller: ReturnType<typeof useContentDisplayController>;
  headerActions?: ReactNode;
}) {
  const {
    canEdit,
    contentDetailsQuery,
    contentSaveIndicator,
    details,
    draft,
    draftDetails,
    handleRegenerateArticle,
    handleRegenerateOutline,
    isGenerating,
    isGeneratingArticle,
    isGeneratingOutline,
    isMetadataOpen,
    isPending,
    isRegenerateArticleOpen,
    isRegenerateOutlineOpen,
    organizationIdentifier,
    projectId,
    setDraftDetails,
    setIsMetadataOpen,
    setIsRegenerateArticleOpen,
    setIsRegenerateOutlineOpen,
    topKeywords,
  } = controller;

  const metricSnapshot = details?.metricSnapshot?.aggregate ?? null;
  const primaryKeywordOverview = details?.primaryKeywordOverview;
  const hasPrimaryKeyword = !!draft?.primaryKeyword.trim();
  const snapshotCtr =
    metricSnapshot && metricSnapshot.impressions > 0
      ? metricSnapshot.clicks / metricSnapshot.impressions
      : 0;
  const [keywordsSortOrder, setKeywordsSortOrder] =
    useState<TopKeywordsSortOrder>("desc");
  const [keywordsMetric, setKeywordsMetric] =
    useState<SnapshotMetric>("clicks");
  const [keywordsPage, setKeywordsPage] = useState(1);
  const [keywordsPageSize, setKeywordsPageSize] = useState(25);
  const [keywordsSearchInput, setKeywordsSearchInput] = useState("");

  return (
    <>
      <LoadingError
        className="px-4 py-3 sm:px-6"
        error={contentDetailsQuery.error}
        errorDescription="Could not load content details for this row."
        errorTitle="Error loading content details"
        isLoading={contentDetailsQuery.isLoading}
        onRetry={contentDetailsQuery.refetch}
      />

      {!contentDetailsQuery.isLoading &&
        !contentDetailsQuery.error &&
        details && (
          <div className="flex h-full flex-col">
            <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
              {isGenerating && (
                <Alert>
                  <Icons.Timer />
                  <AlertTitle>
                    {isGeneratingOutline
                      ? "Outline is being generated"
                      : "Article is being generated"}
                  </AlertTitle>
                  <AlertDescription>
                    Editing is disabled while generation is in progress.
                  </AlertDescription>
                </Alert>
              )}

              <section className="rounded-xl border p-3 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                    {draft?.heroImage ? (
                      <img
                        alt={draft.title ?? "Draft hero image"}
                        className="h-16 w-24 shrink-0 rounded-md object-cover sm:h-20 sm:w-28"
                        src={draft.heroImage}
                      />
                    ) : (
                      <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground sm:h-20 sm:w-28">
                        <Icons.Image className="size-5" />
                      </div>
                    )}
                    <div className="min-w-0 space-y-2">
                      <h2 className="line-clamp-2 font-semibold text-lg leading-tight sm:text-2xl">
                        {draft?.title || "Untitled draft"}
                      </h2>
                      <div className="flex flex-col gap-1 text-muted-foreground text-sm sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-2 sm:gap-y-1">
                        <span className="truncate" title={draft?.slug ?? ""}>
                          /{draft?.slug || "-"}
                        </span>
                        <Separator className="h-4" orientation="vertical" />
                        <span className="inline-flex items-center gap-1.5">
                          <span className="text-foreground">
                            {draft?.primaryKeyword || "-"}
                          </span>
                          {hasPrimaryKeyword && (
                            <PopoverTooltip
                              content={
                                primaryKeywordOverview ? (
                                  <PrimaryKeywordOverview
                                    overview={primaryKeywordOverview}
                                  />
                                ) : (
                                  <div className="space-y-1 text-sm">
                                    <p className="font-medium">
                                      Primary keyword stats
                                    </p>
                                    <p className="text-muted-foreground">
                                      No keyword data is available for this
                                      keyword yet.
                                    </p>
                                  </div>
                                )
                              }
                              contentClassName="border border-border bg-popover text-popover-foreground shadow-md"
                            >
                              <button
                                aria-label="View primary keyword stats"
                                className="inline-flex size-5 cursor-pointer items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                                type="button"
                              >
                                <Icons.Info className="size-3.5" />
                              </button>
                            </PopoverTooltip>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    {headerActions}
                  </div>
                </div>
              </section>

              <Tabs defaultValue="overview">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="keywords">Top keywords</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                  </TabsList>
                  <Button
                    disabled={!canEdit}
                    onClick={() => setIsMetadataOpen(true)}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Icons.Pencil className="size-4" />
                    Edit metadata
                  </Button>
                </div>

                <TabsContent className="space-y-4" value="overview">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <MetricCard
                      label="Clicks"
                      value={formatNullableNumber(
                        metricSnapshot?.clicks ?? null,
                        {
                          fallback: "0",
                        },
                      )}
                    />
                    <MetricCard
                      label="Impressions"
                      value={formatNullableNumber(
                        metricSnapshot?.impressions ?? null,
                        {
                          fallback: "0",
                        },
                      )}
                    />
                    <MetricCard
                      label="CTR"
                      value={formatNullablePercent(snapshotCtr, {
                        fallback: "0.0%",
                      })}
                    />
                    <MetricCard
                      label="Avg position"
                      value={formatNullableNumber(
                        metricSnapshot?.avgPosition ?? null,
                        {
                          fallback: "0",
                          maximumFractionDigits: 1,
                        },
                      )}
                    />
                  </div>

                  <SnapshotTrendChart
                    ctrMultiplier={100}
                    emptyMessage="No series points for this content draft."
                    series={details?.series ?? []}
                  />
                </TabsContent>

                <TabsContent value="keywords">
                  <TopKeywords
                    emptyMessage="No keyword rows in latest content snapshot."
                    metric={keywordsMetric}
                    onMetricChange={setKeywordsMetric}
                    onPageChange={setKeywordsPage}
                    onPageSizeChange={(pageSize) => {
                      setKeywordsPage(1);
                      setKeywordsPageSize(pageSize);
                    }}
                    onSearchInputChange={(value) => {
                      setKeywordsPage(1);
                      setKeywordsSearchInput(value);
                    }}
                    onSortOrderChange={(sortOrder) => {
                      setKeywordsPage(1);
                      setKeywordsSortOrder(sortOrder);
                    }}
                    page={keywordsPage}
                    pageSize={keywordsPageSize}
                    rows={topKeywords.map((keyword) => ({
                      avgPosition: keyword.position,
                      clicks: keyword.clicks,
                      impressions: keyword.impressions,
                      keyword: keyword.keyword,
                    }))}
                    searchInput={keywordsSearchInput}
                    sortOrder={keywordsSortOrder}
                    title="Top keywords"
                  />
                </TabsContent>

                <TabsContent value="content">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between gap-2">
                        <div className="space-y-1">
                          <CardTitle className="text-sm">
                            Article content
                          </CardTitle>
                          <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
                            {contentSaveIndicator.status === "saving" && (
                              <>
                                <Icons.Spinner className="size-3.5 animate-spin" />
                                Saving...
                              </>
                            )}
                            {contentSaveIndicator.status === "saved" && (
                              <>
                                <Icons.Check className="size-3.5" />
                                Saved{" "}
                                {new Date(
                                  contentSaveIndicator.at,
                                ).toLocaleTimeString()}
                              </>
                            )}
                            {contentSaveIndicator.status === "idle" &&
                              "Autosave enabled"}
                          </span>
                        </div>
                        <Button
                          disabled={isPending || !draft}
                          onClick={() => setIsRegenerateArticleOpen(true)}
                          size="sm"
                          type="button"
                          variant="outline"
                        >
                          Regenerate article
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {!draft?.contentMarkdown && isGeneratingArticle && (
                        <p className="text-muted-foreground text-sm">
                          Article generation is in progress.
                        </p>
                      )}
                      {!draft?.contentMarkdown && !isGeneratingArticle && (
                        <p className="text-muted-foreground text-sm">
                          No article content yet.
                        </p>
                      )}
                      <MarkdownEditor
                        markdown={draftDetails.contentMarkdown}
                        onMarkdownChange={(nextMarkdown) =>
                          setDraftDetails((prev) => ({
                            ...prev,
                            contentMarkdown: nextMarkdown,
                          }))
                        }
                        readOnly={!canEdit}
                      />
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            <ManageContentMetadataDialog
              canEdit={canEdit}
              draftDetails={draft ?? null}
              draftId={draft?.id ?? null}
              onOpenChange={setIsMetadataOpen}
              open={isMetadataOpen}
              organizationIdentifier={organizationIdentifier}
              projectId={projectId}
            />

            <DialogDrawer
              onOpenChange={setIsRegenerateOutlineOpen}
              open={isRegenerateOutlineOpen}
            >
              <DialogDrawerHeader>
                <DialogDrawerTitle>Regenerate outline</DialogDrawerTitle>
                <DialogDrawerDescription>
                  Kick off a fresh outline for this draft.
                </DialogDrawerDescription>
              </DialogDrawerHeader>
              <DialogDrawerFooter className="gap-2">
                <Button
                  disabled={isPending || !draft}
                  onClick={handleRegenerateOutline}
                  type="button"
                >
                  Regenerate outline
                </Button>
                <Button
                  onClick={() => setIsRegenerateOutlineOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogDrawerFooter>
            </DialogDrawer>

            <DialogDrawer
              className="sm:max-w-4xl"
              onOpenChange={setIsRegenerateArticleOpen}
              open={isRegenerateArticleOpen}
            >
              <DialogDrawerHeader>
                <DialogDrawerTitle>Regenerate article</DialogDrawerTitle>
                <DialogDrawerDescription>
                  Review the current outline before starting regeneration.
                </DialogDrawerDescription>
              </DialogDrawerHeader>
              <div className="max-h-[70vh] space-y-3 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">Outline</p>
                  <Button
                    disabled={isPending || !draft}
                    onClick={() => setIsRegenerateOutlineOpen(true)}
                    size="sm"
                    variant="outline"
                  >
                    Regenerate outline
                  </Button>
                </div>
                <MarkdownEditor
                  markdown={draft?.outline ?? ""}
                  onMarkdownChange={undefined}
                  readOnly
                />
              </div>
              <DialogDrawerFooter className="gap-2">
                <Button
                  disabled={isPending || !draft}
                  onClick={handleRegenerateArticle}
                  type="button"
                >
                  Regenerate article
                </Button>
                <Button
                  onClick={() => setIsRegenerateArticleOpen(false)}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
              </DialogDrawerFooter>
            </DialogDrawer>
          </div>
        )}
    </>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function PrimaryKeywordOverview({
  overview,
}: {
  overview: NonNullable<
    RouterOutputs["content"]["getDraftDetails"]["primaryKeywordOverview"]
  >;
}) {
  const backlinkInfo = overview.backlinkInfo;

  return (
    <div className="space-y-2 p-1 text-foreground text-sm">
      <p className="font-semibold text-sm">Primary keyword stats</p>
      <div className="space-y-1">
        <p>
          <span className="font-medium">Search volume:</span>{" "}
          {formatNullableNumber(overview.searchVolume.monthlyAverage)} (
          {formatNullableSignedPercent(
            overview.searchVolume.percentageChange?.monthly ?? null,
          )}{" "}
          MoM)
        </p>
        <p>
          <span className="font-medium">CPC:</span>{" "}
          {formatNullableCurrency(overview.competition.cpc)}
        </p>
        <p>
          <span className="font-medium">Competition:</span>{" "}
          {formatNullableNumber(overview.competition.competition)} (
          {overview.competition.competitionLevel ?? "N/A"})
        </p>
        <p>
          <span className="font-medium">Keyword difficulty:</span>{" "}
          {formatNullableNumber(overview.keywordDifficulty)}
        </p>
        <p>
          <span className="font-medium">Avg backlinks (top pages):</span>{" "}
          {formatNullableNumber(backlinkInfo?.averageBacklinkCount ?? null)}
        </p>
        <p>
          <span className="font-medium">Avg referring domains:</span>{" "}
          {formatNullableNumber(
            backlinkInfo?.averageReferringDomainCount ?? null,
          )}
        </p>
      </div>
    </div>
  );
}
