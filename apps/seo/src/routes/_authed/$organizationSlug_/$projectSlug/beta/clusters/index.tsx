import * as Icons from "@rectangular-labs/ui/components/icon";
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
import { mockClusters, mockScheduleEvents } from "../-lib/beta-mock-data";
import { usePendingReviews } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/",
)({
  component: ClustersOverview,
});

function pctChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 1;
  return (current - previous) / previous;
}

function formatPct(p: number) {
  const v = Math.round(p * 1000) / 10;
  return `${v >= 0 ? "+" : ""}${v}%`;
}

function bestAndWorstClustersByClicks(
  clusters: Cluster[],
  range: BetaDateRange,
) {
  const scored = clusters
    .map((c) => {
      const { current, previous } = c.metrics[range];
      return {
        cluster: c,
        deltaPct: pctChange(current.clicks, previous.clicks),
      };
    })
    .sort((a, b) => b.deltaPct - a.deltaPct);

  return {
    best: scored[0],
    worst: scored.at(-1),
  };
}

function ClustersOverview() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const pendingReviews = usePendingReviews();

  const next7 = mockScheduleEvents
    .slice()
    .sort((a, b) => +new Date(a.start) - +new Date(b.start))
    .slice(0, 6);

  const range: BetaDateRange = "28d";
  const perf = bestAndWorstClustersByClicks(mockClusters, range);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            What’s pending for review, what’s scheduled, and why.
          </p>
        </div>
        <Badge variant="secondary">
          {pendingReviews.length} pending reviews
        </Badge>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="font-medium text-sm">
            What we’re doing (mock narrative)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-muted-foreground text-sm">
          <p>
            We are <span className="text-foreground">expanding 2 clusters</span>{" "}
            because recent growth signals are strong (click and impression
            lift).
          </p>
          <p>
            We are{" "}
            <span className="text-foreground">creating 1 new cluster</span>{" "}
            around GEO mentions to capture model citations and “best of”
            comparisons.
          </p>
          <p>
            We are <span className="text-foreground">updating 1 cluster</span>{" "}
            due to CTR decline and position volatility.
          </p>
          <div className="grid gap-2 pt-2 md:grid-cols-3">
            {mockClusters.map((c) => (
              <div className="rounded-md border p-3" key={c.id}>
                <div className="truncate font-medium text-sm">{c.name}</div>
                <div className="truncate text-muted-foreground text-xs">
                  Pillar: {c.pillarKeyword}
                </div>
              </div>
            ))}
          </div>
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/clusters/clusters"
            >
              Browse clusters
            </Link>
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">
              Pending reviews
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {pendingReviews.map((r) => (
              <div
                className="flex items-center justify-between rounded-md border px-3 py-2"
                key={r.id}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">{r.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {r.items.length} items • due {r.dueDate}
                  </div>
                </div>
                <Button asChild size="sm" variant="outline">
                  <Link
                    params={{ organizationSlug, projectSlug, reviewId: r.id }}
                    to="/$organizationSlug/$projectSlug/beta/clusters/review/$reviewId"
                  >
                    Open
                  </Link>
                </Button>
              </div>
            ))}
            <Button asChild className="w-full" variant="outline">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/beta/clusters/reviews"
              >
                View all reviews
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-medium text-sm">Next 7 days</CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link
                  params={{ organizationSlug, projectSlug }}
                  to="/$organizationSlug/$projectSlug/beta/clusters/schedule"
                >
                  Open schedule
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {next7.map((e) => (
              <div
                className="flex items-center gap-3 rounded-md border px-3 py-2"
                key={e.id}
              >
                <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                  <Icons.Timer className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">{e.title}</div>
                  <div className="text-muted-foreground text-xs">
                    {new Date(e.start).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-medium text-sm">
                Cluster performance
              </CardTitle>
              <Button asChild size="sm" variant="outline">
                <Link
                  params={{ organizationSlug, projectSlug }}
                  to="/$organizationSlug/$projectSlug/beta/insights/cluster-performance"
                >
                  Open
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-muted-foreground text-xs">
              Snapshot (last {range}) based on click change.
            </div>
            <div className="grid gap-2">
              {perf.best && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">Best</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {perf.best.cluster.name}
                    </div>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-500 text-xs tabular-nums">
                    {formatPct(perf.best.deltaPct)}
                  </span>
                </div>
              )}
              {perf.worst && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2">
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">Worst</div>
                    <div className="truncate text-muted-foreground text-xs">
                      {perf.worst.cluster.name}
                    </div>
                  </div>
                  <span className="rounded-full bg-red-500/10 px-2 py-1 text-red-500 text-xs tabular-nums">
                    {formatPct(perf.worst.deltaPct)}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
