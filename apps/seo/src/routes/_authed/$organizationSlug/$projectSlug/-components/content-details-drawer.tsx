import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReChartContainer,
  ReChartTooltipContent,
  Tooltip,
  XAxis,
  YAxis,
} from "@rectangular-labs/ui/components/charts/rechart-container";
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
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@rectangular-labs/ui/components/ui/table";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ComponentType, useEffect, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

export type SnapshotMetric = "clicks" | "impressions" | "ctr" | "avgPosition";

const OVERVIEW_CHART_CONFIG = {
  value: {
    label: "Value",
    color: "var(--chart-1)",
  },
};

const metricToggleOptions: {
  ariaLabel: string;
  icon: ComponentType<{ className?: string }>;
  title: string;
  value: SnapshotMetric;
}[] = [
  {
    ariaLabel: "toggle clicks",
    icon: Icons.Hand,
    title: "Clicks",
    value: "clicks",
  },
  {
    ariaLabel: "toggle impressions",
    icon: Icons.EyeOn,
    title: "Impressions",
    value: "impressions",
  },
  {
    ariaLabel: "toggle click through rate",
    icon: Icons.TrendingUp,
    title: "Click Through Rate",
    value: "ctr",
  },
  {
    ariaLabel: "toggle position",
    icon: Icons.Target,
    title: "Position",
    value: "avgPosition",
  },
];

export function ContentDetailsDrawer({
  contentDraftId,
  organizationIdentifier,
  projectId,
  onClose,
  metric,
  onMetricChange,
}: {
  contentDraftId: string | null;
  organizationIdentifier: string;
  projectId: string;
  onClose: () => void;
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const open = !!contentDraftId;
  const draftId = contentDraftId;

  const contentDetailsQuery = useQuery(
    api.content.getDraftDetails.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
        id: draftId ?? "00000000-0000-0000-0000-000000000000",
        months: 3,
      },
      enabled: open && !!draftId,
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

  const strategyListQuery = useQuery(
    api.strategy.list.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
      },
      enabled: open,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  );
  const draft = contentDetailsQuery.data?.contentDraft;

  const { data: generatingOutlineStatusData } = useQuery(
    api.task.getStatus.queryOptions({
      input: { id: draft?.outlineGeneratedByTaskRunId ?? "" },
      enabled: open && !!draft?.outlineGeneratedByTaskRunId,
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
      enabled: open && !!draft?.generatedByTaskRunId,
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

  const [isRegenerateOutlineOpen, setIsRegenerateOutlineOpen] = useState(false);
  const [isRegenerateArticleOpen, setIsRegenerateArticleOpen] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState<
    { status: "idle" } | { status: "saving" } | { status: "saved"; at: string }
  >({ status: "idle" });
  const [draftDetails, setDraftDetails] = useState({
    title: "",
    description: "",
    slug: "",
    primaryKeyword: "",
    contentMarkdown: "",
    strategyId: "",
  });

  const {
    mutate: updateDraft,
    mutateAsync: updateDraftAsync,
    isPending,
  } = useMutation(
    api.content.updateDraft.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        setSaveIndicator({ status: "saved", at: new Date().toISOString() });
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

  const chartPoints = useMemo(() => {
    if (!details?.series) return [];
    return details.series.map((point) => ({
      date: formatShortDate(point.takenAt),
      value: getMetricFromAggregate(point.aggregate, metric),
    }));
  }, [details?.series, metric]);

  useEffect(() => {
    if (!draft) return;
    setDraftDetails({
      title: draft.title ?? "",
      description: draft.description ?? "",
      slug: draft.slug ?? "",
      primaryKeyword: draft.primaryKeyword ?? "",
      contentMarkdown: draft.contentMarkdown ?? "",
      strategyId: draft.strategyId ?? "",
    });
  }, [draft]);

  const saveDetails = () => {
    if (!draft || !canEdit) return;
    setSaveIndicator({ status: "saving" });
    updateDraft({
      organizationIdentifier,
      projectId,
      id: draft.id,
      title: draftDetails.title.trim(),
      description: draftDetails.description.trim(),
      slug: draftDetails.slug.trim(),
      primaryKeyword: draftDetails.primaryKeyword.trim(),
      contentMarkdown: draftDetails.contentMarkdown,
      strategyId: draftDetails.strategyId || null,
    });
  };

  const handleRegenerateOutline = async () => {
    if (!draft) return;
    setSaveIndicator({ status: "saving" });
    await updateDraftAsync({
      organizationIdentifier,
      projectId,
      id: draft.id,
      outlineGeneratedByTaskRunId: null,
    });
    setIsRegenerateOutlineOpen(false);
    toast.success("Outline regeneration started");
  };

  const handleRegenerateArticle = async () => {
    if (!draft) return;
    setSaveIndicator({ status: "saving" });
    await updateDraftAsync({
      organizationIdentifier,
      projectId,
      id: draft.id,
      status: "queued",
      generatedByTaskRunId: null,
    });
    setIsRegenerateArticleOpen(false);
    toast.success("Article regeneration started");
  };

  return (
    <Sheet onOpenChange={(nextOpen) => !nextOpen && onClose()} open={open}>
      <SheetContent className="gap-0 p-0 sm:max-w-4xl">
        <SheetHeader className="border-b">
          <SheetTitle>
            {details?.contentDraft.title ?? "Content details"}
          </SheetTitle>
          <SheetDescription>
            {details?.contentDraft.slug ??
              "Snapshot detail and keyword performance"}
          </SheetDescription>
        </SheetHeader>

        <LoadingError
          className="px-4 py-3"
          error={contentDetailsQuery.error}
          errorDescription="Could not load content details for this row."
          errorTitle="Error loading content details"
          isLoading={contentDetailsQuery.isLoading}
          loadingComponent={<Skeleton className="h-[360px] w-full" />}
          onRetry={contentDetailsQuery.refetch}
        />

        {!contentDetailsQuery.isLoading &&
          !contentDetailsQuery.error &&
          details && (
            <div className="space-y-4 overflow-y-auto p-4">
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

              <LoadingError
                error={contentDetailsQuery.error}
                errorDescription="Could not load the content draft."
                errorTitle="Error loading content draft"
                isLoading={contentDetailsQuery.isLoading}
                loadingComponent={<Skeleton className="h-[240px] w-full" />}
                onRetry={contentDetailsQuery.refetch}
              />

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">
                    Primary keyword overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {!details.contentDraft.primaryKeyword.trim() ? (
                    <p className="text-muted-foreground text-sm">
                      No primary keyword configured.
                    </p>
                  ) : details.primaryKeywordOverview ? (
                    <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <OverviewField
                        label="Search volume"
                        value={`${formatNullableNumber(
                          details.primaryKeywordOverview.searchVolume
                            .monthlyAverage,
                        )} (${formatNullableSignedPercent(
                          details.primaryKeywordOverview.searchVolume
                            .percentageChange?.monthly ?? null,
                        )} MoM)`}
                      />
                      <OverviewField
                        label="CPC"
                        value={formatNullableCurrency(
                          details.primaryKeywordOverview.competition.cpc,
                        )}
                      />
                      <OverviewField
                        label="Competition"
                        value={`${formatNullableNumber(
                          details.primaryKeywordOverview.competition
                            .competition,
                        )} (${details.primaryKeywordOverview.competition.competitionLevel ?? "N/A"})`}
                      />
                      <OverviewField
                        label="Keyword difficulty"
                        value={formatNullableNumber(
                          details.primaryKeywordOverview.keywordDifficulty,
                        )}
                      />
                      <OverviewField
                        label="Avg links for ranking domain"
                        value={formatNullableNumber(
                          details.primaryKeywordOverview.backlinkInfo
                            ?.averageBacklinkCount ?? null,
                        )}
                      />
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      Keyword overview is unavailable right now.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-sm">3-month trend</CardTitle>
                    <MetricToggle
                      metric={metric}
                      onMetricChange={onMetricChange}
                    />
                  </div>
                </CardHeader>
                <CardContent className="h-[240px]">
                  {chartPoints.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
                      No series points for this content draft.
                    </div>
                  ) : (
                    <ReChartContainer
                      className="h-full w-full"
                      config={OVERVIEW_CHART_CONFIG}
                    >
                      <AreaChart data={chartPoints}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis
                          axisLine={false}
                          dataKey="date"
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <YAxis
                          axisLine={false}
                          tick={{ fontSize: 11 }}
                          tickLine={false}
                          tickMargin={8}
                        />
                        <Tooltip
                          content={
                            <ReChartTooltipContent
                              accessibilityLayer={false}
                              active={false}
                              activeIndex={undefined}
                              coordinate={undefined}
                              labelKey="date"
                              payload={[]}
                            />
                          }
                          cursor={{ strokeDasharray: "3 3" }}
                        />
                        <Area
                          dataKey="value"
                          dot
                          fill="var(--color-value)"
                          fillOpacity={0.2}
                          stroke="var(--color-value)"
                          strokeWidth={2}
                          type="linear"
                        />
                      </AreaChart>
                    </ReChartContainer>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Top keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  {topKeywords.length === 0 ? (
                    <p className="text-muted-foreground text-sm">
                      No keyword rows in latest content snapshot.
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Keyword</TableHead>
                          <TableHead>Clicks</TableHead>
                          <TableHead>Impressions</TableHead>
                          <TableHead>Position</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {topKeywords.map((keyword) => (
                          <TableRow key={keyword.keyword}>
                            <TableCell
                              className="max-w-80 truncate"
                              title={keyword.keyword}
                            >
                              {keyword.keyword}
                            </TableCell>
                            <TableCell>
                              {formatNumber(keyword.clicks)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(keyword.impressions)}
                            </TableCell>
                            <TableCell>
                              {formatNumber(keyword.position, 1)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              {!contentDetailsQuery.isLoading &&
                !contentDetailsQuery.error &&
                draft && (
                  <>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Draft details</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-2 sm:col-span-2">
                          <p className="text-muted-foreground text-xs">
                            Assigned strategy
                          </p>
                          <Select
                            disabled={!canEdit || strategyListQuery.isLoading}
                            onValueChange={(value) =>
                              setDraftDetails((prev) => ({
                                ...prev,
                                strategyId: value === "none" ? "" : value,
                              }))
                            }
                            value={draftDetails.strategyId || "none"}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Assign to a strategy" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No strategy</SelectItem>
                              {(strategyListQuery.data?.strategies ?? []).map(
                                (strategy) => (
                                  <SelectItem
                                    key={strategy.id}
                                    value={strategy.id}
                                  >
                                    {strategy.name}
                                  </SelectItem>
                                ),
                              )}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs">Title</p>
                          <Input
                            disabled={!canEdit}
                            onChange={(event) =>
                              setDraftDetails((prev) => ({
                                ...prev,
                                title: event.target.value,
                              }))
                            }
                            value={draftDetails.title}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs">Slug</p>
                          <Input
                            disabled={!canEdit}
                            onChange={(event) =>
                              setDraftDetails((prev) => ({
                                ...prev,
                                slug: event.target.value,
                              }))
                            }
                            value={draftDetails.slug}
                          />
                        </div>
                        <div className="space-y-2">
                          <p className="text-muted-foreground text-xs">
                            Primary keyword
                          </p>
                          <Input
                            disabled={!canEdit}
                            onChange={(event) =>
                              setDraftDetails((prev) => ({
                                ...prev,
                                primaryKeyword: event.target.value,
                              }))
                            }
                            value={draftDetails.primaryKeyword}
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <p className="text-muted-foreground text-xs">
                            Meta description
                          </p>
                          <Textarea
                            disabled={!canEdit}
                            onChange={(event) =>
                              setDraftDetails((prev) => ({
                                ...prev,
                                description: event.target.value,
                              }))
                            }
                            rows={3}
                            value={draftDetails.description}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between gap-2">
                          <CardTitle className="text-sm">
                            Article content
                          </CardTitle>
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
                        {!draft.contentMarkdown && isGeneratingArticle && (
                          <p className="text-muted-foreground text-sm">
                            Article generation is in progress.
                          </p>
                        )}
                        {!draft.contentMarkdown && !isGeneratingArticle && (
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
                  </>
                )}
            </div>
          )}

        <SheetFooter className="border-t">
          <div className="flex w-full items-center justify-between gap-4">
            <span className="inline-flex items-center gap-1 text-muted-foreground text-xs">
              {saveIndicator.status === "saving" && (
                <>
                  <Icons.Spinner className="size-3.5 animate-spin" />
                  Saving...
                </>
              )}
              {saveIndicator.status === "saved" && (
                <>
                  <Icons.Check className="size-3.5" />
                  Saved {new Date(saveIndicator.at).toLocaleTimeString()}
                </>
              )}
            </span>
            <Button disabled={!canEdit || isPending} onClick={saveDetails}>
              Save changes
            </Button>
          </div>
        </SheetFooter>

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
      </SheetContent>
    </Sheet>
  );
}

function MetricToggle({
  metric,
  onMetricChange,
}: {
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-md border p-1">
      {metricToggleOptions.map(({ ariaLabel, icon: Icon, title, value }) => {
        const active = metric === value;
        return (
          <button
            aria-label={ariaLabel}
            className={
              active
                ? "inline-flex items-center gap-1 rounded-md bg-primary px-2 py-1 text-primary-foreground text-xs"
                : "inline-flex items-center gap-1 rounded-md px-2 py-1 text-muted-foreground text-xs"
            }
            key={value}
            onClick={() => onMetricChange(value)}
            type="button"
          >
            <Icon className="size-3.5" />
            {title}
          </button>
        );
      })}
    </div>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function formatShortDate(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatNullableNumber(value: number | null): string {
  if (value === null) return "N/A";
  return formatNumber(value);
}

function formatNullableSignedPercent(value: number | null): string {
  if (value === null) return "N/A";
  const percent = value * 100;
  const sign = percent > 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

function formatNullableCurrency(value: number | null): string {
  if (value === null) return "N/A";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function getMetricFromAggregate(
  aggregate: RouterOutputs["content"]["getDraftDetails"]["series"][number]["aggregate"],
  metric: SnapshotMetric,
): number {
  switch (metric) {
    case "impressions":
      return aggregate.impressions;
    case "ctr":
      return aggregate.ctr * 100;
    case "avgPosition":
      return aggregate.avgPosition;
    case "clicks":
    default:
      return aggregate.clicks;
  }
}
