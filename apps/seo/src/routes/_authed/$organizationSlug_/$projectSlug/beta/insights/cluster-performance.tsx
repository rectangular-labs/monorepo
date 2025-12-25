import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { BetaDateRange, Cluster } from "../-lib/beta-mock-data";
import { mockClusters } from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/insights/cluster-performance",
)({
  component: ClusterPerformancePage,
});

type Driver = "impressions" | "clicks" | "ctr" | "position";

type ClusterPerf = {
  id: string;
  name: string;
  pillarKeyword: string;
  driver: Driver;
  deltaPct: number;
};

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
}

function scoreCluster(cluster: Cluster, range: BetaDateRange): ClusterPerf {
  const { current, previous } = cluster.metrics[range];

  const impressionsDelta = pctChange(current.impressions, previous.impressions);
  const clicksDelta = pctChange(current.clicks, previous.clicks);
  const ctrDelta = pctChange(current.ctr, previous.ctr);
  // Position improves when it goes down; use inverted delta.
  const positionDelta = pctChange(previous.position, current.position);

  const drivers = [
    { driver: "impressions" as const, deltaPct: impressionsDelta },
    { driver: "clicks" as const, deltaPct: clicksDelta },
    { driver: "ctr" as const, deltaPct: ctrDelta },
    { driver: "position" as const, deltaPct: positionDelta },
  ].sort((a, b) => Math.abs(b.deltaPct) - Math.abs(a.deltaPct));

  const top = drivers[0] ?? { driver: "clicks" as const, deltaPct: 0 };
  return {
    id: cluster.id,
    name: cluster.name,
    pillarKeyword: cluster.pillarKeyword,
    driver: top.driver,
    deltaPct: top.deltaPct,
  };
}

function formatPct(p: number) {
  const v = Math.round(p * 1000) / 10;
  return `${v >= 0 ? "+" : ""}${v}%`;
}

function MetricChip({ driver }: { driver: Driver }) {
  const label =
    driver === "ctr"
      ? "CTR"
      : driver === "position"
        ? "Position"
        : driver === "clicks"
          ? "Clicks"
          : "Impressions";
  return (
    <Badge className="capitalize" variant="secondary">
      {label}
    </Badge>
  );
}

function deltaColorClass(p: number) {
  return p >= 0
    ? "text-emerald-500 bg-emerald-500/10"
    : "text-red-500 bg-red-500/10";
}

function ClusterPerformancePage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const range: BetaDateRange = "28d";

  const scored = mockClusters.map((c) => scoreCluster(c, range));
  const best = [...scored].sort((a, b) => b.deltaPct - a.deltaPct).slice(0, 4);
  const worst = [...scored].sort((a, b) => a.deltaPct - b.deltaPct).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Cluster performance
          </h1>
          <p className="text-muted-foreground">
            Top and bottom performers, plus a full cluster list. (Mocked for{" "}
            {range}.)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/clusters/clusters"
            >
              Browse clusters
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">
              Top clusters (driver-based)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {best.map((c) => (
              <ClusterPerfRow
                cluster={c}
                key={c.id}
                organizationSlug={organizationSlug}
                projectSlug={projectSlug}
              />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">
              Worst clusters (driver-based)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {worst.map((c) => (
              <ClusterPerfRow
                cluster={c}
                key={c.id}
                organizationSlug={organizationSlug}
                projectSlug={projectSlug}
              />
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="font-medium text-sm">All clusters</CardTitle>
            <Badge variant="secondary">Range: {range}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {mockClusters.map((c) => {
            const { current, previous } = c.metrics[range];
            const clicksDelta = pctChange(current.clicks, previous.clicks);
            const imprDelta = pctChange(
              current.impressions,
              previous.impressions,
            );
            const ctrDelta = pctChange(current.ctr, previous.ctr);
            const posDelta = pctChange(previous.position, current.position);
            return (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border px-3 py-2"
                key={c.id}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">{c.name}</div>
                  <div className="truncate text-muted-foreground text-xs">
                    Pillar: {c.pillarKeyword}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <Badge variant="secondary">
                    Clicks{" "}
                    <span className="ml-1 tabular-nums">
                      {current.clicks.toLocaleString()}
                    </span>
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-1 tabular-nums ${deltaColorClass(clicksDelta)}`}
                  >
                    {formatPct(clicksDelta)}
                  </span>
                  <Badge variant="secondary">
                    Impr{" "}
                    <span className="ml-1 tabular-nums">
                      {current.impressions.toLocaleString()}
                    </span>
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-1 tabular-nums ${deltaColorClass(imprDelta)}`}
                  >
                    {formatPct(imprDelta)}
                  </span>
                  <Badge variant="secondary">
                    CTR{" "}
                    <span className="ml-1 tabular-nums">
                      {Math.round(current.ctr * 1000) / 10}%
                    </span>
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-1 tabular-nums ${deltaColorClass(ctrDelta)}`}
                  >
                    {formatPct(ctrDelta)}
                  </span>
                  <Badge variant="secondary">
                    Pos{" "}
                    <span className="ml-1 tabular-nums">
                      {current.position}
                    </span>
                  </Badge>
                  <span
                    className={`rounded-full px-2 py-1 tabular-nums ${deltaColorClass(posDelta)}`}
                  >
                    {formatPct(posDelta)}
                  </span>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      params={{
                        organizationSlug,
                        projectSlug,
                        clusterId: c.id,
                      }}
                      to="/$organizationSlug/$projectSlug/beta/clusters/cluster/$clusterId"
                    >
                      Open
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function ClusterPerfRow({
  cluster,
  organizationSlug,
  projectSlug,
}: {
  cluster: ClusterPerf;
  organizationSlug: string;
  projectSlug: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border px-3 py-2">
      <div className="min-w-0">
        <div className="truncate font-medium text-sm">{cluster.name}</div>
        <div className="truncate text-muted-foreground text-xs">
          Pillar: {cluster.pillarKeyword}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <MetricChip driver={cluster.driver} />
        <span
          className={`rounded-full px-2 py-1 text-xs tabular-nums ${deltaColorClass(cluster.deltaPct)}`}
        >
          {formatPct(cluster.deltaPct)}
        </span>
        <Button asChild size="sm" variant="outline">
          <Link
            params={{ organizationSlug, projectSlug, clusterId: cluster.id }}
            to="/$organizationSlug/$projectSlug/beta/clusters/cluster/$clusterId"
          >
            Open
          </Link>
        </Button>
      </div>
    </div>
  );
}
