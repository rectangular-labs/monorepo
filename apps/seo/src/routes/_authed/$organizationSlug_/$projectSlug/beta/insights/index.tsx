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
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  mockCompetitorRanks,
  mockRecommendations,
  mockTrafficTimeseries,
  mockVisibilityTimeseries,
} from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/insights/",
)({
  component: InsightsOverview,
});

const visibilityChartConfig = {
  visibility: { label: "Visibility", color: "var(--chart-1)" },
};

const trafficChartConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
  impressions: { label: "Impressions", color: "var(--chart-2)" },
};

function InsightsOverview() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const you = mockCompetitorRanks.find((r) => r.isYou);
  const last = mockTrafficTimeseries.at(-1);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-3xl tracking-tight">Overview</h1>
          <p className="text-muted-foreground">
            A blended view of visibility, site performance, and suggested
            changes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/insights/contextual-performance"
            >
              <Icons.TrendingUp className="mr-2 size-4" />
              Contextual performance
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/insights/site-performance"
            >
              <Icons.EyeOn className="mr-2 size-4" />
              Site performance
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-medium text-sm">
                Visibility ranking
              </CardTitle>
              <Badge variant="secondary">Last 7 days</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline justify-between">
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">Your score</div>
                <div className="font-semibold text-2xl">{you?.score ?? 0}%</div>
              </div>
              <div className="text-right text-muted-foreground text-xs">
                vs last week{" "}
                <span className="text-emerald-500">+{you?.deltaPct ?? 0}%</span>
              </div>
            </div>

            <ReChartContainer
              className="h-[160px] w-full"
              config={visibilityChartConfig}
            >
              <AreaChart data={mockVisibilityTimeseries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
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
                />
                <Area
                  dataKey="visibility"
                  dot={false}
                  fill="var(--color-visibility)"
                  fillOpacity={0.18}
                  stroke="var(--color-visibility)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ReChartContainer>

            <div className="space-y-2">
              {mockCompetitorRanks.slice(0, 4).map((r, idx) => (
                <div
                  className="flex items-center justify-between text-sm"
                  key={r.name}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-4 text-muted-foreground">{idx + 1}</span>
                    <span className={r.isYou ? "font-medium" : ""}>
                      {r.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        r.deltaPct >= 0 ? "text-emerald-500" : "text-red-500"
                      }
                    >
                      {r.deltaPct >= 0 ? `+${r.deltaPct}%` : `${r.deltaPct}%`}
                    </span>
                    <span className="tabular-nums">{r.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="font-medium text-sm">
                Clicks &amp; impressions trend
              </CardTitle>
              <Badge variant="secondary">Mocked</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Metric
                icon={<Icons.Hand className="size-4" />}
                label="Clicks"
                value={last?.clicks ?? 0}
              />
              <Metric
                icon={<Icons.EyeOn className="size-4" />}
                label="Impressions"
                value={last?.impressions ?? 0}
              />
              <Metric
                icon={<Icons.Target className="size-4" />}
                label="CTR"
                value={`${Math.round((last?.ctr ?? 0) * 100 * 10) / 10}%`}
              />
              <Metric
                icon={<Icons.ArrowDown className="size-4" />}
                label="Avg position"
                value={last?.position ?? 0}
              />
            </div>

            <ReChartContainer
              className="h-[220px] w-full"
              config={trafficChartConfig}
            >
              <AreaChart data={mockTrafficTimeseries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis
                  axisLine={false}
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickLine={false}
                />
                <YAxis
                  axisLine={false}
                  tick={{ fontSize: 10 }}
                  tickLine={false}
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
                />
                <Area
                  dataKey="impressions"
                  dot={false}
                  fill="var(--color-impressions)"
                  fillOpacity={0.12}
                  stroke="var(--color-impressions)"
                  strokeWidth={2}
                  type="monotone"
                />
                <Area
                  dataKey="clicks"
                  dot={false}
                  fill="var(--color-clicks)"
                  fillOpacity={0.2}
                  stroke="var(--color-clicks)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ReChartContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-sm">
              Suggested changes
            </CardTitle>
            <Button asChild size="sm" variant="outline">
              <Link
                params={{ organizationSlug, projectSlug }}
                to="/$organizationSlug/$projectSlug/beta/clusters/site-recommendations"
              >
                View all
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {mockRecommendations.slice(0, 4).map((rec) => {
            const kinds = Array.from(new Set(rec.actions.map((a) => a.kind)));
            const priorityVariant =
              rec.priority === "high"
                ? ("default" as const)
                : ("secondary" as const);
            const priorityLabel =
              rec.priority === "high"
                ? "High priority"
                : rec.priority === "medium"
                  ? "Medium"
                  : "Low";
            return (
              <div
                className="flex flex-wrap items-start justify-between gap-3 rounded-md border px-3 py-2"
                key={rec.id}
              >
                <div className="min-w-0">
                  <div className="truncate font-medium text-sm">
                    {rec.title}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {rec.summary}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant={priorityVariant}>{priorityLabel}</Badge>
                  {kinds.map((k) => (
                    <Badge className="capitalize" key={k} variant="secondary">
                      {k}
                    </Badge>
                  ))}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({
  label,
  value,
  icon,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between text-muted-foreground text-xs">
        <span>{label}</span>
        {icon}
      </div>
      <div className="mt-2 font-semibold text-xl tabular-nums">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
    </div>
  );
}

// (SuggestionCard removed in favor of a holistic recommendation list.)
