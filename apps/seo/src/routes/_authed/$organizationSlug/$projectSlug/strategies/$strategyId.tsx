import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { capitalize } from "@rectangular-labs/core/format/capitalize";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import { useMutation, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffect, useRef, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ContentDetailsDrawer } from "../-components/content-details-drawer";
import {
  SnapshotTrendChart,
  type SnapshotMetric,
} from "../-components/snapshot-trend-chart";
import type {
  ContentTableSortBy,
  SortOrder,
} from "../-components/content-table";
import { TopKeywords } from "../-components/top-keywords";
import { ManageStrategyDialog } from "./-components/manage-strategy-dialog";
import { ManageStrategyPhaseDialog } from "./-components/manage-strategy-phase-dialog";
import { StrategyContentTab } from "./-components/strategy-content-tab";

type Tab = "overview" | "content" | "keywords";
type ContentSortBy = Exclude<ContentTableSortBy, "strategy">;
type StrategyRouteSearch = (typeof Route)["types"]["fullSearchSchema"];
type LocalSearchState = {
  tab: Tab;
  overviewMetric: SnapshotMetric;
  contentSortBy: ContentSortBy | null;
  contentSortOrder: SortOrder;
  keywordsMetric: SnapshotMetric;
  keywordsSortOrder: SortOrder;
  keywordsPage: number;
  keywordsPageSize: number;
  keywordsSearch: string;
  contentDraftId: string | null;
};

function toLocalSearchState(search: StrategyRouteSearch): LocalSearchState {
  return {
    tab: search.tab ?? "overview",
    overviewMetric: search.overviewMetric ?? "clicks",
    contentSortBy: search.contentSortBy ?? null,
    contentSortOrder: search.contentSortOrder ?? "desc",
    keywordsMetric: search.keywordsMetric ?? "clicks",
    keywordsSortOrder: search.keywordsSortOrder ?? "desc",
    keywordsPage: Math.max(1, search.keywordsPage ?? 1),
    keywordsPageSize: Math.max(1, search.keywordsPageSize ?? 25),
    keywordsSearch: search.keywordsSearch ?? "",
    contentDraftId: search.contentDraftId ?? null,
  };
}

function isSameLocalSearchState(
  a: LocalSearchState,
  b: LocalSearchState,
): boolean {
  return (
    a.tab === b.tab &&
    a.overviewMetric === b.overviewMetric &&
    a.contentSortBy === b.contentSortBy &&
    a.contentSortOrder === b.contentSortOrder &&
    a.keywordsMetric === b.keywordsMetric &&
    a.keywordsSortOrder === b.keywordsSortOrder &&
    a.keywordsPage === b.keywordsPage &&
    a.keywordsPageSize === b.keywordsPageSize &&
    a.keywordsSearch === b.keywordsSearch &&
    a.contentDraftId === b.contentDraftId
  );
}

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/strategies/$strategyId",
)({
  head: ({ params }) => ({
    links: [
      {
        rel: "canonical",
        href: `/${params.organizationSlug}/${params.projectSlug}/strategies/${params.strategyId}`,
      },
    ],
  }),
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  validateSearch: type({
    "tab?": "'overview' | 'content' | 'keywords'",
    "overviewMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
    "contentSortBy?":
      "'clicks' | 'impressions' | 'ctr' | 'avgPosition' | 'title' | 'status' | 'primaryKeyword'",
    "contentSortOrder?": "'asc' | 'desc'",
    "keywordsMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
    "keywordsSortOrder?": "'asc' | 'desc'",
    "keywordsPage?": "number.integer",
    "keywordsPageSize?": "number.integer",
    "keywordsSearch?": "string",
    "contentDraftId?": "string.uuid",
  }),
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, strategyId } = Route.useParams();
  const routeSearch = Route.useSearch();
  const navigate = Route.useNavigate();
  const api = getApiClientRq();
  const isLocalUpdatePendingRef = useRef(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [phaseViewOpen, setPhaseViewOpen] = useState(false);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState<LocalSearchState>(() =>
    toLocalSearchState(routeSearch),
  );
  const routeLocalSearch = toLocalSearchState(routeSearch);
  const setLocalSearchState = useCallback(
    (updater: (prev: LocalSearchState) => LocalSearchState) => {
      isLocalUpdatePendingRef.current = true;
      setLocalSearch(updater);
    },
    [],
  );

  const tab = localSearch.tab;
  const overviewMetric = localSearch.overviewMetric;
  const contentSortBy = localSearch.contentSortBy;
  const contentSortOrder = localSearch.contentSortOrder;
  const keywordsMetric = localSearch.keywordsMetric;
  const keywordsSortOrder = localSearch.keywordsSortOrder;
  const keywordsPage = localSearch.keywordsPage;
  const keywordsPageSize = localSearch.keywordsPageSize;

  const { data: activeProject } = useSuspenseQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data: strategy,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.strategy.get.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
        id: strategyId,
      },
      enabled: !!activeProject.id && !!strategyId,
    }),
  );

  const overviewSeriesQuery = useQuery(
    api.strategy.snapshot.series.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
        strategyId,
        months: 3,
      },
      enabled: !!activeProject.id && !!strategyId,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  );

  const keywordsQuery = useQuery(
    api.strategy.snapshot.keywords.list.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
        strategyId,
      },
      enabled: tab === "keywords" && !!activeProject.id && !!strategyId,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  );

  useEffect(() => {
    if (isLocalUpdatePendingRef.current) return;
    if (isSameLocalSearchState(localSearch, routeLocalSearch)) return;

    setLocalSearch(routeLocalSearch);
  }, [localSearch, routeLocalSearch]);

  useEffect(() => {
    if (isSameLocalSearchState(localSearch, routeLocalSearch)) {
      isLocalUpdatePendingRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      const normalizedKeywordsSearch = localSearch.keywordsSearch.trim();
      navigate({
        search: (prev) => ({
          ...prev,
          tab: localSearch.tab,
          overviewMetric: localSearch.overviewMetric,
          contentSortBy: localSearch.contentSortBy ?? undefined,
          contentSortOrder: localSearch.contentSortOrder,
          keywordsMetric: localSearch.keywordsMetric,
          keywordsSortOrder: localSearch.keywordsSortOrder,
          keywordsPage: localSearch.keywordsPage,
          keywordsPageSize: localSearch.keywordsPageSize,
          keywordsSearch: normalizedKeywordsSearch || undefined,
          contentDraftId: localSearch.contentDraftId ?? undefined,
        }),
        replace: true,
        resetScroll: false,
      });
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [localSearch, navigate, routeLocalSearch]);

  const currentPhase = getCurrentPhase(strategy?.phases ?? []);
  const latestSnapshot = strategy?.snapshots?.[0] ?? null;
  const goalProgress = getGoalProgress(
    strategy,
    overviewSeriesQuery.data?.points ?? [],
  );

  const { mutate: createSnapshot, isPending: isCreatingSnapshot } = useMutation(
    api.strategy.snapshot.create.mutationOptions({
      onError: (mutationError) => {
        toast.error(mutationError.message);
      },
      onSuccess: () => {
        toast.success("Snapshot queued");
      },
    }),
  );

  const canCreateSnapshot =
    strategy?.status === "active" || strategy?.status === "observing";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex items-center gap-3 text-sm">
        <Button asChild size="sm" variant="ghost">
          <Link
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/strategies"
          >
            <Icons.ArrowLeft className="size-4" />
            Back to strategies
          </Link>
        </Button>
      </div>

      <LoadingError
        error={error}
        errorDescription="There was an error loading this strategy."
        errorTitle="Error loading strategy"
        isLoading={isLoading}
        onRetry={() => refetch()}
      />

      {!isLoading && !error && strategy && (
        <div className="space-y-6">
          <StrategyHeader
            canCreateSnapshot={canCreateSnapshot}
            goalProgress={goalProgress}
            isCreatingSnapshot={isCreatingSnapshot}
            onEdit={() => setEditOpen(true)}
            onTakeSnapshot={() =>
              createSnapshot({
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
                strategyId,
              })
            }
            onView={() => setViewOpen(true)}
            strategy={strategy}
          />
          <ViewStrategyDetailDialog
            onEdit={() => {
              setViewOpen(false);
              setEditOpen(true);
            }}
            onOpenChange={setViewOpen}
            open={viewOpen}
            strategy={strategy}
          />
          <ManageStrategyDialog
            onOpenChange={setEditOpen}
            open={editOpen}
            organizationId={activeProject.organizationId}
            projectId={activeProject.id}
            strategy={strategy}
          />
          <ManageStrategyPhaseDialog
            onOpenChange={setPhaseEditOpen}
            open={phaseEditOpen}
            organizationId={activeProject.organizationId}
            phase={currentPhase ?? null}
            projectId={activeProject.id}
          />
          <ViewPhaseDetailDialog
            onEdit={() => {
              setPhaseViewOpen(false);
              setPhaseEditOpen(true);
            }}
            onOpenChange={setPhaseViewOpen}
            open={phaseViewOpen}
            phase={currentPhase ?? null}
          />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest snapshot</CardTitle>
              </CardHeader>
              <CardContent>
                {latestSnapshot ? (
                  <div className="space-y-2">
                    <p className="text-sm">
                      Captured {formatDateTime(latestSnapshot.takenAt)}
                    </p>
                    {latestSnapshot.delta && (
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <SnapshotDeltaPill
                          label="Clicks"
                          value={latestSnapshot.delta.clicks}
                        />
                        <SnapshotDeltaPill
                          label="Impressions"
                          value={latestSnapshot.delta.impressions}
                        />
                        <SnapshotDeltaPill
                          label="Position"
                          lowerIsBetter
                          value={latestSnapshot.delta.avgPosition}
                        />
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No data yet.</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current phase</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPhase ? (
                  <PhaseCard
                    onEdit={() => setPhaseEditOpen(true)}
                    onView={() => setPhaseViewOpen(true)}
                    phase={currentPhase}
                  />
                ) : (
                  <Empty className="border-none p-0">
                    <EmptyHeader>
                      <EmptyMedia variant="icon" />
                      <EmptyTitle>No active phase yet</EmptyTitle>
                      <EmptyDescription>
                        Strategy phases will appear once they are generated.
                      </EmptyDescription>
                    </EmptyHeader>
                  </Empty>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs
            onValueChange={(value) => {
              setLocalSearchState((prev) => ({
                ...prev,
                tab: value as Tab,
                contentDraftId:
                  value === "content" ? prev.contentDraftId : null,
              }));
            }}
            value={tab}
          >
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <OverviewTab
                error={overviewSeriesQuery.error}
                isLoading={overviewSeriesQuery.isLoading}
                metric={overviewMetric}
                onMetricChange={(metric) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    overviewMetric: metric,
                  }));
                }}
                points={overviewSeriesQuery.data?.points ?? []}
                retry={overviewSeriesQuery.refetch}
              />
            </TabsContent>

            <TabsContent value="content">
              <StrategyContentTab
                onChangeSort={(sortBy) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    contentSortBy: sortBy,
                  }));
                }}
                onChangeSortOrder={(sortOrder) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    contentSortOrder: sortOrder,
                  }));
                }}
                onOpenContentDetails={(contentDraftId) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    tab: "content",
                    contentDraftId,
                  }));
                }}
                organizationIdentifier={activeProject.organizationId}
                projectId={activeProject.id}
                projectSlug={projectSlug}
                selectedContentDraftId={localSearch.contentDraftId}
                sortBy={contentSortBy}
                sortOrder={contentSortOrder}
                strategyId={strategyId}
              />
              <ContentDetailsDrawer
                contentDraftId={localSearch.contentDraftId}
                onClose={() => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    contentDraftId: null,
                  }));
                }}
                organizationIdentifier={activeProject.organizationId}
                organizationSlug={organizationSlug}
                projectId={activeProject.id}
                projectSlug={projectSlug}
              />
            </TabsContent>

            <TabsContent value="keywords">
              <TopKeywords
                emptyMessage="No keyword data for the selected filters."
                error={keywordsQuery.error}
                isLoading={keywordsQuery.isLoading}
                metric={keywordsMetric}
                onMetricChange={(metric) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsMetric: metric,
                    keywordsPage: 1,
                  }));
                }}
                onPageChange={(page) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsPage: page,
                  }));
                }}
                onPageSizeChange={(pageSize) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsPage: 1,
                    keywordsPageSize: pageSize,
                  }));
                }}
                onRetry={keywordsQuery.refetch}
                onSearchInputChange={(keywordsSearch) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsPage: 1,
                    keywordsSearch,
                  }));
                }}
                onSortOrderChange={(sortOrder) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsSortOrder: sortOrder,
                    keywordsPage: 1,
                  }));
                }}
                page={keywordsPage}
                pageSize={keywordsPageSize}
                rows={keywordsQuery.data?.rows ?? []}
                searchInput={localSearch.keywordsSearch}
                sortOrder={keywordsSortOrder}
              />
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  );
}

type Strategy = RouterOutputs["strategy"]["get"];
type StrategyPhase = Strategy["phases"][number];
type OverviewPoint =
  RouterOutputs["strategy"]["snapshot"]["series"]["points"][number];

function StrategyHeader({
  strategy,
  onEdit,
  onTakeSnapshot,
  onView,
  canCreateSnapshot,
  isCreatingSnapshot,
  goalProgress,
}: {
  strategy: Strategy;
  onEdit: () => void;
  onTakeSnapshot: () => void;
  onView: () => void;
  canCreateSnapshot: boolean;
  isCreatingSnapshot: boolean;
  goalProgress: {
    baseline: number;
    current: number;
    value: number;
    percent: number;
    takenAt: Date;
  } | null;
}) {
  const canEdit = strategy.status !== "suggestion";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <Badge
            variant={strategy.status === "suggestion" ? "secondary" : "outline"}
          >
            {capitalize(strategy.status)}
          </Badge>
          <h1 className="text-2xl leading-snug">{strategy.name}</h1>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground text-sm">
            <span>
              Goal:{" "}
              <span className="text-foreground">
                {formatStrategyGoal(strategy.goal)}
              </span>
            </span>
            <Button
              className="h-auto px-0 text-xs"
              onClick={onView}
              size="sm"
              type="button"
              variant="link"
            >
              View more
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            disabled={!canCreateSnapshot}
            isLoading={isCreatingSnapshot}
            onClick={onTakeSnapshot}
            size="sm"
            type="button"
            variant="outline"
          >
            Take snapshot
          </Button>
          {canEdit && (
            <Button onClick={onEdit} size="sm" type="button" variant="outline">
              <Icons.Pencil className="size-4" />
              Edit strategy
            </Button>
          )}
        </div>
      </div>

      {goalProgress ? (
        <div className="space-y-3 rounded-lg border p-4">
          <div className="grid gap-2 text-sm md:grid-cols-3">
            <div className="text-muted-foreground">
              Baseline{" "}
              <span className="text-foreground">
                {formatMetricValue(strategy.goal.metric, goalProgress.baseline)}
              </span>
            </div>
            <div className="text-muted-foreground">
              Current{" "}
              <span className="text-foreground">
                {formatMetricValue(strategy.goal.metric, goalProgress.current)}
              </span>
            </div>
            <div className="text-muted-foreground">
              Target{" "}
              <span className="text-foreground">
                {formatMetricValue(strategy.goal.metric, strategy.goal.target)}
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>
                Progress (
                {formatMetricSignedValue(
                  strategy.goal.metric,
                  goalProgress.value,
                )}
                )
              </span>
              <span>{goalProgress.percent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-[width]"
                style={{ width: `${goalProgress.percent}%` }}
              />
            </div>
          </div>
          <p className="text-muted-foreground text-xs">
            Latest snapshot {formatDateTime(goalProgress.takenAt)}
          </p>
        </div>
      ) : (
        <p className="text-muted-foreground text-sm">
          No snapshots yet. Take a snapshot to track progress.
        </p>
      )}
    </div>
  );
}

function ViewStrategyDetailDialog({
  strategy,
  open,
  onOpenChange,
  onEdit,
}: {
  strategy: Strategy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  return (
    <DialogDrawer
      className="sm:max-w-2xl"
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogDrawerHeader>
        <Badge className="w-fit" variant="outline">
          {capitalize(strategy.status)}
        </Badge>
        <DialogDrawerTitle className="leading-snug">
          {strategy.name}
        </DialogDrawerTitle>
        <DialogDrawerDescription className="sr-only">
          Strategy details
        </DialogDrawerDescription>
      </DialogDrawerHeader>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="text-muted-foreground text-sm">
          Goal:{" "}
          <span className="font-medium text-foreground">
            {formatStrategyGoal(strategy.goal)}
          </span>
        </div>

        {strategy.motivation && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Motivation
            </p>
            <p className="whitespace-pre-line text-sm">{strategy.motivation}</p>
          </div>
        )}

        {strategy.description && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Description
            </p>
            <p className="whitespace-pre-wrap text-sm">
              {strategy.description}
            </p>
          </div>
        )}

        {strategy.phases.length > 0 && (
          <div className="space-y-1">
            <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
              Phases
            </p>
            <ul className="space-y-1">
              {strategy.phases.map((phase) => (
                <li className="text-sm" key={phase.id}>
                  <span className="text-muted-foreground capitalize">
                    {phase.type}
                  </span>{" "}
                  &mdash; {phase.name}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <DialogDrawerFooter className="gap-2">
        <Button
          onClick={() => onOpenChange(false)}
          type="button"
          variant="ghost"
        >
          Close
        </Button>
        {strategy.status !== "suggestion" && (
          <Button onClick={onEdit} size="sm" type="button">
            Edit strategy
          </Button>
        )}
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}

function ViewPhaseDetailDialog({
  phase,
  open,
  onOpenChange,
  onEdit,
}: {
  phase: StrategyPhase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  if (!phase) return null;

  return (
    <DialogDrawer
      className="sm:max-w-2xl"
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogDrawerHeader>
        <Badge className="w-fit capitalize" variant="outline">
          {formatPhaseStatus(phase.status)}
        </Badge>
        <DialogDrawerTitle className="leading-snug">
          {phase.name}
        </DialogDrawerTitle>
        <DialogDrawerDescription className="sr-only">
          Phase details
        </DialogDrawerDescription>
      </DialogDrawerHeader>

      <div className="max-h-[70vh] space-y-4 overflow-y-auto">
        <div className="text-muted-foreground text-sm">
          Type: <span className="text-foreground capitalize">{phase.type}</span>
        </div>

        <div className="text-muted-foreground text-sm">
          Target completion:{" "}
          <span className="text-foreground">
            {phase.targetCompletionDate
              ? formatDateTime(phase.targetCompletionDate)
              : "Not set"}
          </span>
        </div>

        <div className="text-muted-foreground text-sm">
          Observation weeks:{" "}
          <span className="text-foreground">{phase.observationWeeks}</span>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Success criteria
          </p>
          <p className="whitespace-pre-wrap text-sm">
            {phase.successCriteria || "No success criteria provided yet."}
          </p>
        </div>

        <div className="space-y-1">
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wide">
            Cadence
          </p>
          <p className="text-sm">
            Every {phase.cadence.frequency} {phase.cadence.period} on{" "}
            {phase.cadence.allowedDays.map(formatWeekdayLabel).join(", ")}
          </p>
        </div>

        <div className="text-muted-foreground text-sm">
          Phase content items:{" "}
          <span className="text-foreground">{phase.phaseContents.length}</span>
        </div>
      </div>

      <DialogDrawerFooter className="gap-2">
        <Button
          onClick={() => onOpenChange(false)}
          type="button"
          variant="ghost"
        >
          Close
        </Button>
        <Button onClick={onEdit} size="sm" type="button">
          Edit phase
        </Button>
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}

function PhaseCard({
  phase,
  onView,
  onEdit,
}: {
  phase: StrategyPhase;
  onView: () => void;
  onEdit: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border p-4 text-left transition hover:border-primary/40"
      onClick={onView}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <p className="font-medium">{phase.name}</p>
          <p className="text-muted-foreground text-sm">
            {formatPhaseStatus(phase.status)}
          </p>
        </div>
        <Button
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          size="sm"
          type="button"
          variant="ghost"
        >
          Edit
        </Button>
      </div>
    </button>
  );
}

function SnapshotDeltaPill({
  label,
  value,
  lowerIsBetter = false,
}: {
  label: string;
  value: number;
  lowerIsBetter?: boolean;
}) {
  const isPositive = lowerIsBetter ? value < 0 : value > 0;

  return (
    <div className="rounded-md border px-2 py-1">
      <p className="text-[11px] text-muted-foreground uppercase">{label}</p>
      <p
        className={
          isPositive
            ? "text-emerald-600 text-xs"
            : value === 0
              ? "text-muted-foreground text-xs"
              : "text-red-600 text-xs"
        }
      >
        {value > 0 ? "+" : ""}
        {formatNumber(value, 1)}
      </p>
    </div>
  );
}

function OverviewTab({
  metric,
  onMetricChange,
  points,
  isLoading,
  error,
  retry,
}: {
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
  points: OverviewPoint[];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}) {
  if (isLoading || error) {
    return (
      <Card>
        <CardContent className="h-[280px] pt-6">
          <LoadingError
            error={error}
            errorDescription="Could not load strategy snapshot series."
            errorTitle="Error loading overview"
            isLoading={isLoading}
            loadingComponent={<Skeleton className="h-full w-full" />}
            onRetry={retry}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <SnapshotTrendChart
      emptyMessage="No snapshots in the last 3 months."
      initialMetric={metric}
      onMetricChange={onMetricChange}
      series={points}
    />
  );
}

function formatPhaseStatus(status: StrategyPhase["status"]) {
  return status.replace("_", " ");
}

function formatWeekdayLabel(day: string) {
  const labels: Record<string, string> = {
    mon: "Mon",
    tue: "Tue",
    wed: "Wed",
    thu: "Thu",
    fri: "Fri",
    sat: "Sat",
    sun: "Sun",
  };

  return labels[day] ?? day;
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function formatMetricValue(metric: Strategy["goal"]["metric"], value: number) {
  if (metric === "avgPosition") {
    return `#${formatNumber(value, 1)}`;
  }
  return formatNumber(value, 0);
}

function formatMetricSignedValue(
  metric: Strategy["goal"]["metric"],
  value: number,
) {
  if (metric === "avgPosition") {
    const sign = value >= 0 ? "-" : "+";
    return `${sign}${formatNumber(Math.abs(value), 1)}`;
  }
  const sign = value >= 0 ? "+" : "";
  return `${sign}${formatNumber(value, 0)}`;
}

function getGoalProgress(
  strategy: Strategy | undefined,
  points: OverviewPoint[],
) {
  if (!strategy || points.length < 2)
    return {
      baseline: 0,
      current: 0,
      value: 0,
      percent: 0,
      takenAt: new Date(),
    };

  const baselinePoint = points[0];
  const currentPoint = points[points.length - 1];
  if (!baselinePoint || !currentPoint)
    return {
      baseline: 0,
      current: 0,
      value: 0,
      percent: 0,
      takenAt: new Date(),
    };

  const baseline = getGoalMetricValue(
    strategy.goal.metric,
    baselinePoint.aggregate,
  );
  const current = getGoalMetricValue(
    strategy.goal.metric,
    currentPoint.aggregate,
  );
  const progressValue =
    strategy.goal.metric === "avgPosition"
      ? baseline - current
      : current - baseline;

  if (!Number.isFinite(strategy.goal.target) || strategy.goal.target <= 0) {
    return {
      baseline: 0,
      current: 0,
      value: 0,
      percent: 0,
      takenAt: currentPoint.takenAt,
    };
  }

  const percent = Math.max(
    0,
    Math.min(100, Math.round((progressValue / strategy.goal.target) * 100)),
  );

  return {
    baseline,
    current,
    value: progressValue,
    percent,
    takenAt: currentPoint.takenAt,
  };
}

function getGoalMetricValue(
  metric: Strategy["goal"]["metric"],
  aggregate: { clicks: number; impressions: number; avgPosition: number },
) {
  if (metric === "impressions") return aggregate.impressions;
  if (metric === "avgPosition") return aggregate.avgPosition;
  return aggregate.clicks;
}

function getCurrentPhase(phases: StrategyPhase[]) {
  if (phases.length === 0) return null;
  const activePhase = phases.find((phase) =>
    ["in_progress", "planned", "observing"].includes(phase.status),
  );
  if (activePhase) return activePhase;
  const observingPhase = phases.find((phase) => phase.status === "observing");
  return observingPhase ?? phases[0];
}
