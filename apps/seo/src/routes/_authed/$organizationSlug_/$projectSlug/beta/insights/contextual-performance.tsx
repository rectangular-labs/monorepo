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
import { createFileRoute } from "@tanstack/react-router";
import {
  mockCompetitorRanks,
  mockVisibilityTimeseries,
} from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/insights/contextual-performance",
)({
  component: ContextualPerformancePage,
});

const chartConfig = {
  visibility: { label: "Visibility", color: "var(--chart-1)" },
};

function ContextualPerformancePage() {
  const you = mockCompetitorRanks.find((r) => r.isYou);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Contextual performance
          </h1>
          <p className="text-muted-foreground">
            Situate your brand relative to competitors for key topics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="outline">
            Last 7 days
          </Button>
          <Button size="sm" variant="ghost">
            Last 30 days
          </Button>
          <Button size="sm" variant="ghost">
            Custom range
            <Icons.ChevronDown className="ml-1 size-4 opacity-70" />
          </Button>
          <div className="mx-1 hidden h-6 w-px bg-border md:block" />
          <Button size="sm" variant="outline">
            <Icons.Sparkles className="mr-2 size-4" />
            All models
          </Button>
          <Button size="sm" variant="outline">
            <Icons.Globe className="mr-2 size-4" />
            Region
          </Button>
          <Button size="sm" variant="outline">
            <Icons.Filter className="mr-2 size-4" />
            Filter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="font-medium text-sm">
                  Brand visibility
                </CardTitle>
                <p className="text-muted-foreground text-xs">
                  Percentage of AI answers that mention your brand.
                </p>
              </div>
              <Badge variant="secondary">Mocked</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-baseline gap-3">
              <div className="font-semibold text-3xl">{you?.score ?? 0}%</div>
              <div className="text-muted-foreground text-sm">
                <span className="rounded-full bg-emerald-500/10 px-2 py-1 text-emerald-500 text-xs">
                  +{you?.deltaPct ?? 0}%
                </span>{" "}
                vs last week
              </div>
            </div>

            <ReChartContainer className="h-[260px] w-full" config={chartConfig}>
              <AreaChart data={mockVisibilityTimeseries}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis axisLine={false} dataKey="date" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis axisLine={false} tick={{ fontSize: 11 }} tickLine={false} />
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
                  dataKey="visibility"
                  dot={false}
                  fill="var(--color-visibility)"
                  fillOpacity={0.18}
                  name="Visibility"
                  stroke="var(--color-visibility)"
                  strokeWidth={2}
                  type="monotone"
                />
              </AreaChart>
            </ReChartContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="font-medium text-sm">
              Brand industry ranking
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {mockCompetitorRanks.map((r, idx) => (
              <div
                className="flex items-center justify-between rounded-md px-2 py-2 hover:bg-muted/40"
                key={r.name}
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 text-muted-foreground text-sm">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate font-medium text-sm">
                      {r.name}
                    </div>
                    {r.isYou && (
                      <div className="text-muted-foreground text-xs">You</div>
                    )}
                  </div>
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


