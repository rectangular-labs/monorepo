import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { capitalize } from "@rectangular-labs/core/format/capitalize";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import { BarList } from "@rectangular-labs/ui/components/charts/bar-list";
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
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
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
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@rectangular-labs/ui/components/ui/pagination";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { type } from "arktype";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ManageStrategyDialog } from "./-components/manage-strategy-dialog";
import { ManageStrategyPhaseDialog } from "./-components/manage-strategy-phase-dialog";

type Tab = "overview" | "content" | "keywords";
type SnapshotMetric = "clicks" | "impressions" | "ctr" | "avgPosition";
type ContentSortBy =
  | "clicks"
  | "impressions"
  | "ctr"
  | "avgPosition"
  | "title"
  | "status";
type SortOrder = "asc" | "desc";
type StrategyRouteSearch = (typeof Route)["types"]["fullSearchSchema"];
type LocalSearchState = {
  tab: Tab;
  overviewMetric: SnapshotMetric;
  contentSortBy: ContentSortBy;
  contentSortOrder: SortOrder;
  keywordsMetric: SnapshotMetric;
  keywordsSortOrder: SortOrder;
  keywordsPage: number;
  keywordsPageSize: number;
  keywordsSearch: string;
  contentDraftId: string | null;
  drawerMetric: SnapshotMetric;
};

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

function toLocalSearchState(search: StrategyRouteSearch): LocalSearchState {
  return {
    tab: search.tab ?? "overview",
    overviewMetric: search.overviewMetric ?? "clicks",
    contentSortBy: search.contentSortBy ?? "clicks",
    contentSortOrder: search.contentSortOrder ?? "desc",
    keywordsMetric: search.keywordsMetric ?? "clicks",
    keywordsSortOrder: search.keywordsSortOrder ?? "desc",
    keywordsPage: Math.max(1, search.keywordsPage ?? 1),
    keywordsPageSize: Math.max(1, search.keywordsPageSize ?? 25),
    keywordsSearch: search.keywordsSearch ?? "",
    contentDraftId: search.contentDraftId ?? null,
    drawerMetric: search.drawerMetric ?? "clicks",
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
    a.contentDraftId === b.contentDraftId &&
    a.drawerMetric === b.drawerMetric
  );
}

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/strategies/$strategyId",
)({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  validateSearch: type({
    "tab?": "'overview' | 'content' | 'keywords'",
    "overviewMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
    "contentSortBy?":
      "'clicks' | 'impressions' | 'ctr' | 'avgPosition' | 'title' | 'status'",
    "contentSortOrder?": "'asc' | 'desc'",
    "keywordsMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
    "keywordsSortOrder?": "'asc' | 'desc'",
    "keywordsPage?": "number.integer",
    "keywordsPageSize?": "number.integer",
    "keywordsSearch?": "string",
    "contentDraftId?": "string.uuid",
    "drawerMetric?": "'clicks' | 'impressions' | 'ctr' | 'avgPosition'",
  }),
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, strategyId } = Route.useParams();
  const routeSearch = Route.useSearch();
  const navigate = Route.useNavigate();
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const isLocalUpdatePendingRef = useRef(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [phaseViewOpen, setPhaseViewOpen] = useState(false);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
  const [localSearch, setLocalSearch] = useState<LocalSearchState>(() =>
    toLocalSearchState(routeSearch),
  );
  const routeLocalSearch = toLocalSearchState(routeSearch);
  const [hasLoadedContentTab, setHasLoadedContentTab] = useState(
    routeLocalSearch.tab === "content",
  );
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
  const drawerMetric = localSearch.drawerMetric;

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

  const contentListQuery = useQuery(
    api.strategy.snapshot.content.list.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
        strategyId,
        sortBy: contentSortBy,
        sortOrder: contentSortOrder,
      },
      enabled: hasLoadedContentTab && !!activeProject.id && !!strategyId,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
    }),
  );

  const contentDetailsQuery = useQuery(
    api.strategy.snapshot.content.details.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        projectId: activeProject.id,
        strategyId,
        contentDraftId:
          localSearch.contentDraftId ?? "00000000-0000-0000-0000-000000000000",
        months: 3,
      },
      enabled:
        !!localSearch.contentDraftId &&
        !!activeProject.id &&
        !!strategyId &&
        hasLoadedContentTab,
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 60,
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
    if (tab === "content") {
      setHasLoadedContentTab(true);
    }
  }, [tab]);

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
          contentSortBy: localSearch.contentSortBy,
          contentSortOrder: localSearch.contentSortOrder,
          keywordsMetric: localSearch.keywordsMetric,
          keywordsSortOrder: localSearch.keywordsSortOrder,
          keywordsPage: localSearch.keywordsPage,
          keywordsPageSize: localSearch.keywordsPageSize,
          keywordsSearch: normalizedKeywordsSearch || undefined,
          contentDraftId: localSearch.contentDraftId ?? undefined,
          drawerMetric: localSearch.drawerMetric,
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
      onSuccess: async () => {
        toast.success("Snapshot queued");
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: api.strategy.get.queryKey({
              input: {
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
                id: strategyId,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: api.strategy.list.queryKey({
              input: {
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: api.strategy.snapshot.series.queryKey({
              input: {
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
                strategyId,
                months: 3,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: api.strategy.snapshot.content.list.queryKey({
              input: {
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
                strategyId,
                sortBy: contentSortBy,
                sortOrder: contentSortOrder,
              },
            }),
          }),
          queryClient.invalidateQueries({
            queryKey: api.strategy.snapshot.keywords.list.queryKey({
              input: {
                organizationIdentifier: activeProject.organizationId,
                projectId: activeProject.id,
                strategyId,
              },
            }),
          }),
        ]);
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
              <ContentTab
                contentSortBy={contentSortBy}
                contentSortOrder={contentSortOrder}
                onChangeContentSort={(sortBy) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    contentSortBy: sortBy,
                  }));
                }}
                onChangeContentSortOrder={(sortOrder) => {
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
                onRetry={contentListQuery.refetch}
                query={contentListQuery}
                selectedContentDraftId={localSearch.contentDraftId}
              />
              <ContentDetailsDrawer
                contentDetailsQuery={contentDetailsQuery}
                contentDraftId={localSearch.contentDraftId}
                metric={drawerMetric}
                organizationIdentifier={activeProject.organizationId}
                onClose={() => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    contentDraftId: null,
                  }));
                }}
                onMetricChange={(metric) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    drawerMetric: metric,
                  }));
                }}
                onRefreshContentList={contentListQuery.refetch}
                projectId={activeProject.id}
              />
            </TabsContent>

            <TabsContent value="keywords">
              <TopKeywordsTab
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
                onSortOrderChange={(sortOrder) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsSortOrder: sortOrder,
                    keywordsPage: 1,
                  }));
                }}
                page={keywordsPage}
                pageSize={keywordsPageSize}
                query={keywordsQuery}
                searchInput={localSearch.keywordsSearch}
                setSearchInput={(keywordsSearch) => {
                  setLocalSearchState((prev) => ({
                    ...prev,
                    keywordsPage: 1,
                    keywordsSearch,
                  }));
                }}
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
type ContentListRow =
  RouterOutputs["strategy"]["snapshot"]["content"]["list"]["rows"][number];

type ContentListQuery = ReturnType<
  typeof useQuery<RouterOutputs["strategy"]["snapshot"]["content"]["list"]>
>;

type ContentDetailsQuery = ReturnType<
  typeof useQuery<RouterOutputs["strategy"]["snapshot"]["content"]["details"]>
>;

type KeywordsQuery = ReturnType<
  typeof useQuery<RouterOutputs["strategy"]["snapshot"]["keywords"]["list"]>
>;

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
  const chartPoints = useMemo(
    () =>
      points.map((point) => ({
        date: formatShortDate(point.takenAt),
        value: getMetricFromAggregate(point.aggregate, metric),
      })),
    [metric, points],
  );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Overview trend</CardTitle>
          <MetricToggle metric={metric} onMetricChange={onMetricChange} />
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        <LoadingError
          error={error}
          errorDescription="Could not load strategy snapshot series."
          errorTitle="Error loading overview"
          isLoading={isLoading}
          loadingComponent={<Skeleton className="h-full w-full" />}
          onRetry={retry}
        />
        {!isLoading && !error && points.length === 0 && (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            No snapshots in the last 3 months.
          </div>
        )}
        {!isLoading && !error && points.length > 0 && (
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
  );
}

function ContentTab({
  query,
  selectedContentDraftId,
  contentSortBy,
  contentSortOrder,
  onChangeContentSort,
  onChangeContentSortOrder,
  onOpenContentDetails,
  onRetry,
}: {
  query: ContentListQuery;
  selectedContentDraftId: string | null;
  contentSortBy: ContentSortBy;
  contentSortOrder: SortOrder;
  onChangeContentSort: (sortBy: ContentSortBy) => void;
  onChangeContentSortOrder: (sortOrder: SortOrder) => void;
  onOpenContentDetails: (contentDraftId: string) => void;
  onRetry: () => void;
}) {
  const rows = query.data?.rows ?? [];
  const columns = useMemo<ColumnDef<ContentListRow>[]>(
    () => [
      {
        accessorFn: (row) => row.title,
        cell: ({ row }) => (
          <span
            className="block max-w-64 truncate"
            title={row.original.title ?? undefined}
          >
            {row.original.title ?? "To be determined"}
          </span>
        ),
        enableSorting: true,
        header: "Title",
        id: "title",
      },
      {
        accessorFn: (row) => row.role,
        cell: ({ row }) => row.original.role ?? "-",
        enableSorting: false,
        header: "Role",
        id: "role",
      },
      {
        accessorFn: (row) => row.status,
        cell: ({ row }) => capitalize(row.original.status),
        enableSorting: true,
        header: "Status",
        id: "status",
      },
      {
        accessorFn: (row) => row.aggregate.clicks,
        cell: ({ row }) => formatNumber(row.original.aggregate.clicks),
        enableSorting: true,
        header: "Clicks",
        id: "clicks",
      },
      {
        accessorFn: (row) => row.aggregate.impressions,
        cell: ({ row }) => formatNumber(row.original.aggregate.impressions),
        enableSorting: true,
        header: "Impressions",
        id: "impressions",
      },
      {
        accessorFn: (row) => row.aggregate.ctr,
        cell: ({ row }) => formatPercent(row.original.aggregate.ctr),
        enableSorting: true,
        header: "CTR",
        id: "ctr",
      },
      {
        accessorFn: (row) => row.aggregate.avgPosition,
        cell: ({ row }) => formatNumber(row.original.aggregate.avgPosition, 1),
        enableSorting: true,
        header: "Position",
        id: "avgPosition",
      },
      {
        accessorFn: (row) => row.topKeywords[0]?.keyword,
        cell: ({ row }) => (
          <span
            className="block max-w-64 truncate"
            title={row.original.topKeywords[0]?.keyword ?? "-"}
          >
            {row.original.topKeywords[0]?.keyword ?? "-"}
          </span>
        ),
        enableSorting: false,
        header: "Top keyword",
        id: "topKeyword",
      },
    ],
    [],
  );
  const table = useReactTable({
    columns,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    manualSorting: true,
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="text-base">Strategy content</CardTitle>
        <p className="text-muted-foreground text-xs">
          Click a row to inspect top keywords, keyword overview, and trend.
        </p>
      </CardHeader>
      <CardContent>
        <LoadingError
          error={query.error}
          errorDescription="Could not load content snapshot rows."
          errorTitle="Error loading content"
          isLoading={query.isLoading}
          loadingComponent={<Skeleton className="h-[240px] w-full" />}
          onRetry={onRetry}
        />

        {!query.isLoading && !query.error && rows.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
            No content rows available in the latest snapshot.
          </div>
        )}

        {!query.isLoading && !query.error && rows.length > 0 && (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    if (header.isPlaceholder) {
                      return <TableHead key={header.id} />;
                    }

                    const canSort = header.column.getCanSort();
                    const isSorted = contentSortBy === header.column.id;

                    return (
                      <TableHead key={header.id}>
                        <button
                          className="inline-flex items-center gap-1.5 font-medium"
                          onClick={() => {
                            if (!canSort) return;
                            const nextSortBy = header.column
                              .id as ContentSortBy;
                            if (contentSortBy !== nextSortBy) {
                              onChangeContentSort(nextSortBy);
                              return;
                            }
                            onChangeContentSortOrder(
                              contentSortOrder === "asc" ? "desc" : "asc",
                            );
                          }}
                          type="button"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          {canSort &&
                            isSorted &&
                            contentSortOrder === "asc" && (
                              <Icons.FilterAscending className="size-3.5 text-muted-foreground" />
                            )}
                          {canSort &&
                            isSorted &&
                            contentSortOrder === "desc" && (
                              <Icons.FilterDescending className="size-3.5 text-muted-foreground" />
                            )}
                          {canSort && !isSorted && (
                            <Icons.ChevronsUpDown className="size-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map((row) => (
                <TableRow
                  className={
                    selectedContentDraftId === row.original.contentDraftId
                      ? "bg-muted/40"
                      : ""
                  }
                  key={row.id}
                  onClick={() =>
                    onOpenContentDetails(row.original.contentDraftId)
                  }
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      onOpenContentDetails(row.original.contentDraftId);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

function ContentDetailsDrawer({
  contentDetailsQuery,
  contentDraftId,
  organizationIdentifier,
  projectId,
  onClose,
  metric,
  onMetricChange,
  onRefreshContentList,
}: {
  contentDetailsQuery: ContentDetailsQuery;
  contentDraftId: string | null;
  organizationIdentifier: string;
  projectId: string;
  onClose: () => void;
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
  onRefreshContentList: () => Promise<unknown>;
}) {
  const api = getApiClientRq();
  const open = contentDetailsQuery.isEnabled;
  const details = contentDetailsQuery.data;
  const draftId = contentDraftId;
  const topKeywords = details?.metricSnapshot?.topKeywords ?? [];
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
  });

  const draftQuery = useQuery(
    api.content.getDraft.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
        id: draftId ?? "00000000-0000-0000-0000-000000000000",
      },
      enabled: open && !!draftId,
      refetchInterval: (context) => {
        const draft = context.state.data?.draft;
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

  const draft = draftQuery.data?.draft;

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
          draftQuery.refetch(),
          onRefreshContentList(),
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
                error={draftQuery.error}
                errorDescription="Could not load the content draft."
                errorTitle="Error loading content draft"
                isLoading={draftQuery.isLoading}
                loadingComponent={<Skeleton className="h-[240px] w-full" />}
                onRetry={draftQuery.refetch}
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

              {!draftQuery.isLoading && !draftQuery.error && draft && (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Draft details</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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

function TopKeywordsTab({
  query,
  metric,
  sortOrder,
  page,
  pageSize,
  searchInput,
  setSearchInput,
  onMetricChange,
  onSortOrderChange,
  onPageChange,
  onPageSizeChange,
}: {
  query: KeywordsQuery;
  metric: SnapshotMetric;
  sortOrder: SortOrder;
  page: number;
  pageSize: number;
  searchInput: string;
  setSearchInput: (value: string) => void;
  onMetricChange: (metric: SnapshotMetric) => void;
  onSortOrderChange: (sortOrder: SortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}) {
  const rows = query.data?.rows ?? [];
  const normalizedSearch = searchInput.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearch) return rows;
    return rows.filter((row) =>
      row.keyword.toLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, rows]);

  const sortedRows = useMemo(() => {
    const direction = sortOrder === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => {
      if (metric === "impressions") {
        return (a.impressions - b.impressions) * direction;
      }
      if (metric === "ctr") {
        return (a.ctr - b.ctr) * direction;
      }
      if (metric === "avgPosition") {
        return (a.avgPosition - b.avgPosition) * direction;
      }
      return (a.clicks - b.clicks) * direction;
    });
  }, [filteredRows, metric, sortOrder]);

  const total = sortedRows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(Math.max(page, 1), totalPages);
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  const pagedRows = sortedRows.slice(start, end);

  useEffect(() => {
    if (currentPage !== page) {
      onPageChange(currentPage);
    }
  }, [currentPage, onPageChange, page]);

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Top keywords</CardTitle>
          <div className="flex items-center gap-2">
            <MetricToggle metric={metric} onMetricChange={onMetricChange} />
            <Button
              onClick={() =>
                onSortOrderChange(sortOrder === "asc" ? "desc" : "asc")
              }
              size="icon-sm"
              title={sortOrder === "asc" ? "Sort descending" : "Sort ascending"}
              variant="outline"
            >
              {sortOrder === "asc" ? (
                <Icons.FilterAscending className="size-4" />
              ) : (
                <Icons.FilterDescending className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <div className="relative max-w-sm">
          <Icons.Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search keyword..."
            value={searchInput}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoadingError
          error={query.error}
          errorDescription="Could not load top keyword data."
          errorTitle="Error loading top keywords"
          isLoading={query.isLoading}
          loadingComponent={<Skeleton className="h-[260px] w-full" />}
          onRetry={query.refetch}
        />

        {!query.isLoading && !query.error && sortedRows.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
            No keyword data for the selected filters.
          </div>
        )}

        {!query.isLoading && !query.error && sortedRows.length > 0 && (
          <>
            <BarList
              className="pt-2"
              data={pagedRows.map((row) => ({
                key: row.keyword,
                name: row.keyword,
                value: getMetricFromAggregate(row, metric),
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: row.ctr,
                avgPosition: row.avgPosition,
              }))}
              sortOrder="none"
              valueFormatter={(value, item) =>
                metric === "ctr"
                  ? `${formatPercent(value)} (${formatNumber(item.clicks)} clicks)`
                  : metric === "avgPosition"
                    ? `${formatNumber(value, 1)} (${formatNumber(item.impressions)} imp)`
                    : `${formatNumber(value)} (${formatPercent(item.ctr)} ctr)`
              }
            />

            {total > 0 && (
              <Pagination className="justify-end">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      className={
                        currentPage <= 1 ? "pointer-events-none opacity-50" : ""
                      }
                      onClick={() =>
                        currentPage > 1 && onPageChange(currentPage - 1)
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                      onClick={() =>
                        currentPage < totalPages &&
                        onPageChange(currentPage + 1)
                      }
                    />
                  </PaginationItem>
                  <PaginationItem>
                    <span className="px-4 text-muted-foreground text-sm">
                      {total === 0
                        ? "0"
                        : `${(currentPage - 1) * pageSize + 1}-${Math.min(
                            currentPage * pageSize,
                            total,
                          )}`}{" "}
                      of {total}
                    </span>
                  </PaginationItem>
                  <PaginationItem>
                    <DropDrawer>
                      <DropDrawerTrigger asChild>
                        <Button size="sm" variant="outline">
                          {pageSize} per page
                        </Button>
                      </DropDrawerTrigger>
                      <DropDrawerContent>
                        {[10, 25, 50, 100].map((pageSize) => (
                          <DropDrawerItem
                            key={pageSize}
                            onSelect={() => onPageSizeChange(pageSize)}
                          >
                            {pageSize} per page
                          </DropDrawerItem>
                        ))}
                      </DropDrawerContent>
                    </DropDrawer>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

function OverviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-2">
      <p className="text-muted-foreground text-xs">{label}</p>
      <p className="font-medium text-sm">{value}</p>
    </div>
  );
}

function MetricToggle({
  metric,
  onMetricChange,
  disabled = false,
}: {
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
  disabled?: boolean;
}) {
  return (
    <ToggleGroup
      disabled={disabled}
      onValueChange={(value) => {
        if (!value) return;
        onMetricChange(value as SnapshotMetric);
      }}
      type="single"
      value={metric}
    >
      {metricToggleOptions.map((option) => (
        <ToggleGroupItem
          aria-label={option.ariaLabel}
          key={option.value}
          size="sm"
          title={option.title}
          value={option.value}
          variant="outline"
        >
          <option.icon className="size-4" />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
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

function formatShortDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(value);
}

function formatNumber(value: number, digits = 0) {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

function formatPercent(value: number) {
  return `${formatNumber(value * 100, 1)}%`;
}

function formatNullableNumber(value: number | null) {
  return value === null ? "-" : formatNumber(value, 1);
}

function formatNullableCurrency(value: number | null) {
  if (value === null) return "-";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNullableSignedPercent(value: number | null) {
  if (value === null) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${formatNumber(value, 1)}%`;
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

function getMetricFromAggregate(
  aggregate: {
    clicks: number;
    impressions: number;
    ctr: number;
    avgPosition: number;
  },
  metric: SnapshotMetric,
) {
  if (metric === "impressions") return aggregate.impressions;
  if (metric === "ctr") return aggregate.ctr;
  if (metric === "avgPosition") return aggregate.avgPosition;
  return aggregate.clicks;
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
