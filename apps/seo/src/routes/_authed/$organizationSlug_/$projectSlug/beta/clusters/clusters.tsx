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
import { useMemo, useState } from "react";
import type { BetaDateRange } from "../-lib/beta-mock-data";
import { mockClusters } from "../-lib/beta-mock-data";
import { usePendingReviews } from "../-lib/pending-reviews-store";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/clusters/clusters",
)({
  component: ClustersListPage,
});

function ClustersListPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const [range, setRange] = useState<BetaDateRange>("28d");
  const pendingReviews = usePendingReviews();

  const clusters = useMemo(() => {
    return mockClusters.slice().sort((a, b) => {
      const aClicks = a.metrics[range].current.clicks;
      const bClicks = b.metrics[range].current.clicks;
      return bClicks - aClicks;
    });
  }, [range]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">Clusters</h1>
          <p className="text-muted-foreground">
            A quick scan of pillar keywords and performance in the last {range}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <RangePill active={range === "7d"} onClick={() => setRange("7d")}>
            7 days
          </RangePill>
          <RangePill active={range === "28d"} onClick={() => setRange("28d")}>
            28 days
          </RangePill>
          <RangePill active={range === "90d"} onClick={() => setRange("90d")}>
            90 days
          </RangePill>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2">
              <Icons.AlertTriangleIcon className="size-4 text-amber-500" />
              <div className="text-sm">
                <span className="font-medium">Pending reviews:</span>{" "}
                <span className="text-muted-foreground">
                  {pendingReviews.length} review(s) need attention.
                </span>
              </div>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/beta/clusters/reviews"
              >
                View reviews
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4">
        {clusters.map((c) => {
          const m = c.metrics[range].current;
          return (
            <Card key={c.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="truncate text-base">
                      {c.name}
                    </CardTitle>
                    <div className="truncate text-muted-foreground text-sm">
                      Pillar: {c.pillarKeyword}
                    </div>
                  </div>
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
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  Clicks: <span className="ml-1 tabular-nums">{m.clicks}</span>
                </Badge>
                <Badge variant="secondary">
                  Impressions:{" "}
                  <span className="ml-1 tabular-nums">{m.impressions}</span>
                </Badge>
                <Badge variant="secondary">
                  CTR:{" "}
                  <span className="ml-1 tabular-nums">
                    {Math.round(m.ctr * 1000) / 10}%
                  </span>
                </Badge>
                <Badge variant="secondary">
                  Pos: <span className="ml-1 tabular-nums">{m.position}</span>
                </Badge>
                <span className="ml-auto text-muted-foreground text-xs">
                  Updated {c.lastUpdated}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function RangePill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Button
      onClick={onClick}
      size="sm"
      variant={active ? "default" : "outline"}
    >
      {children}
    </Button>
  );
}
