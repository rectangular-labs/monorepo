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
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
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
import {
  useMutation,
  useQuery,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { ManageStrategyDialog } from "./-components/manage-strategy-dialog";
import { ManageStrategyPhaseDialog } from "./-components/manage-strategy-phase-dialog";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/strategies/$strategyId",
)({
  beforeLoad: ({ context }) => {
    if (!context.user?.email?.endsWith("fluidposts.com")) {
      throw notFound();
    }
  },
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug, strategyId } = Route.useParams();
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [phaseEditOpen, setPhaseEditOpen] = useState(false);
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

  const currentPhase = getCurrentPhase(strategy?.phases ?? []);
  const contentPhase = currentPhase ?? strategy?.phases?.[0] ?? null;
  const contentRows = contentPhase?.phaseContents ?? [];
  const latestSnapshot = strategy?.snapshots?.[0] ?? null;
  const latestTopKeywords = getLatestTopKeywords(latestSnapshot);
  const progress = strategy
    ? getGoalProgressFromSnapshot(strategy, latestSnapshot)
    : null;
  const { mutate: createSnapshot, isPending: isCreatingSnapshot } = useMutation(
    api.strategy.snapshot.create.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
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
        ]);
      },
    }),
  );
  const canCreateSnapshot =
    strategy?.status === "active" || strategy?.status === "observing";

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <div className="flex items-center justify-between gap-3 text-sm">
        <Button asChild size="sm" variant="ghost">
          <Link
            params={{ organizationSlug, projectSlug }}
            to="/$organizationSlug/$projectSlug/strategies"
          >
            <Icons.ArrowLeft className="size-4" />
            Back to strategies
          </Link>
        </Button>
        <Button
          disabled={!canCreateSnapshot}
          isLoading={isCreatingSnapshot}
          onClick={() =>
            createSnapshot({
              organizationIdentifier: activeProject.organizationId,
              projectId: activeProject.id,
              strategyId,
            })
          }
          size="sm"
          type="button"
          variant="outline"
        >
          Take snapshot
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
            onEdit={() => setEditOpen(true)}
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

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current phase</CardTitle>
              </CardHeader>
              <CardContent>
                {currentPhase ? (
                  <PhaseCard
                    onEdit={() => setPhaseEditOpen(true)}
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

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Latest insight</CardTitle>
              </CardHeader>
              <CardContent>
                {latestSnapshot?.aiInsight ? (
                  <div className="space-y-2">
                    <p className="text-sm">{latestSnapshot.aiInsight}</p>
                    <p className="text-muted-foreground text-xs">
                      Taken at {formatDateTime(latestSnapshot.takenAt)}
                    </p>
                  </div>
                ) : (
                  <p className="text-muted-foreground text-sm">No data yet.</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="keywords">Top Keywords</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Goal progress</CardTitle>
                </CardHeader>
                <CardContent>
                  {progress ? (
                    <div className="space-y-4 rounded-lg border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                        <div className="text-muted-foreground">
                          Current:{" "}
                          <span className="text-foreground">
                            {formatMetricValue(
                              strategy.goal.metric,
                              progress.current,
                            )}
                          </span>
                        </div>
                        <div className="text-muted-foreground">
                          Target:{" "}
                          <span className="text-foreground">
                            {formatMetricValue(
                              strategy.goal.metric,
                              strategy.goal.target,
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-muted-foreground text-xs">
                          <span>Progress</span>
                          <span>{progress.percent}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-primary transition-[width]"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        Snapshot taken at {formatDateTime(progress.takenAt)}
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
                      No data yet.
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Strategy content</CardTitle>
                </CardHeader>
                <CardContent>
                  {contentRows.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
                      No content has been attached to this phase yet.
                    </div>
                  ) : (
                    <StrategyContentTable rows={contentRows} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="keywords">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top keywords</CardTitle>
                </CardHeader>
                <CardContent>
                  {latestTopKeywords.length === 0 ? (
                    <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
                      No data yet.
                    </div>
                  ) : (
                    <TopKeywordsTable rows={latestTopKeywords} />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </main>
  );
}

type Strategy = RouterOutputs["strategy"]["get"];
type StrategyPhase = Strategy["phases"][number];
type StrategyPhaseContent = Strategy["phases"][number]["phaseContents"][number];
type StrategySnapshot = Strategy["snapshots"][number];

function StrategyHeader({
  strategy,
  onEdit,
}: {
  strategy: Strategy;
  onEdit: () => void;
}) {
  const canEdit = strategy.status !== "suggestion";

  return (
    <Card
      className={
        canEdit ? "cursor-pointer transition hover:border-primary/40" : ""
      }
      onClick={canEdit ? onEdit : undefined}
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant={strategy.status === "suggestion" ? "secondary" : "outline"}
          >
            {capitalize(strategy.status)}
          </Badge>
          {canEdit && (
            <Button
              className="ml-auto"
              onClick={(event) => {
                event.stopPropagation();
                onEdit();
              }}
              size="sm"
              type="button"
              variant="ghost"
            >
              <Icons.Pencil className="size-4" />
              Edit strategy
            </Button>
          )}
        </div>
        <div className="space-y-1">
          <CardTitle className="text-2xl">{strategy.name}</CardTitle>
          {strategy.motivation && (
            <p className="text-muted-foreground">{strategy.motivation}</p>
          )}
        </div>
        <div className="text-muted-foreground text-sm">
          Goal:{" "}
          <span className="text-foreground">
            {formatStrategyGoal(strategy.goal)}
          </span>
        </div>
      </CardHeader>
    </Card>
  );
}

function PhaseCard({
  phase,
  onEdit,
}: {
  phase: StrategyPhase;
  onEdit: () => void;
}) {
  return (
    <button
      className="w-full rounded-lg border p-4 text-left transition hover:border-primary/40"
      onClick={onEdit}
      type="button"
    >
      <div className="space-y-1">
        <p className="font-medium">{phase.name}</p>
        <p className="text-muted-foreground text-sm">
          {formatPhaseStatus(phase.status)}
        </p>
      </div>
    </button>
  );
}

function StrategyContentTable({ rows }: { rows: StrategyPhaseContent[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Clicks (7d)</TableHead>
          <TableHead>Impressions (7d)</TableHead>
          <TableHead>CTR (7d)</TableHead>
          <TableHead>Primary keyword</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => {
          const title = row.contentDraft?.title ?? "Untitled";
          const role = row.contentDraft?.role ?? row.role ?? "—";
          const status = row.contentDraft?.status ?? "planned";
          return (
            <TableRow key={row.id}>
              <TableCell className="max-w-60 truncate" title={title}>
                {title}
              </TableCell>
              <TableCell className="capitalize">{role}</TableCell>
              <TableCell className="capitalize">{status}</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell>—</TableCell>
              <TableCell>
                {row.contentDraft?.primaryKeyword ??
                  row.plannedPrimaryKeyword ??
                  "—"}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function TopKeywordsTable({
  rows,
}: {
  rows: {
    keyword: string;
    clicks: number;
    impressions: number;
    position: number;
  }[];
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Keyword</TableHead>
          <TableHead>Clicks</TableHead>
          <TableHead>Impressions</TableHead>
          <TableHead>Avg position</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.keyword}>
            <TableCell className="max-w-80 truncate" title={row.keyword}>
              {row.keyword}
            </TableCell>
            <TableCell>{formatNumber(row.clicks)}</TableCell>
            <TableCell>{formatNumber(row.impressions)}</TableCell>
            <TableCell>{formatNumber(row.position, 1)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function formatPhaseStatus(status: StrategyPhase["status"]) {
  return status.replace("_", " ");
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

function getGoalProgressFromSnapshot(
  strategy: Strategy,
  snapshot: StrategySnapshot | null,
) {
  if (!snapshot) return null;

  const current = getGoalMetricValue(strategy.goal.metric, snapshot.aggregate);
  const target = strategy.goal.target;
  if (!Number.isFinite(target) || target <= 0) return null;

  const percent =
    strategy.goal.metric === "avgPosition"
      ? current <= target
        ? 100
        : Math.max(0, Math.min(100, Math.round((target / current) * 100)))
      : Math.max(0, Math.min(100, Math.round((current / target) * 100)));

  return {
    current,
    percent,
    takenAt: snapshot.takenAt,
  };
}

function getGoalMetricValue(
  metric: Strategy["goal"]["metric"],
  aggregate: StrategySnapshot["aggregate"],
) {
  switch (metric) {
    case "clicks":
      return aggregate.clicks;
    case "impressions":
      return aggregate.impressions;
    case "avgPosition":
      return aggregate.avgPosition;
    default:
      return 0;
  }
}

function getLatestTopKeywords(snapshot: StrategySnapshot | null) {
  if (!snapshot) return [];
  return [];
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
