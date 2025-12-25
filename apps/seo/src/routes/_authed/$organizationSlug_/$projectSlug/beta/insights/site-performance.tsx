import {
  Area,
  AreaChart,
  CartesianGrid,
  ReChartContainer,
  ReChartLegend,
  ReChartLegendContent,
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
import type { BetaDateRange } from "../-lib/beta-mock-data";
import { mockTrafficTimeseries } from "../-lib/beta-mock-data";

export const Route = createFileRoute(
  "/_authed/$organizationSlug_/$projectSlug/beta/insights/site-performance",
)({
  component: SitePerformancePage,
});

const chartConfig = {
  clicks: { label: "Clicks", color: "var(--chart-1)" },
  impressions: { label: "Impressions", color: "var(--chart-2)" },
};

function metricRow(
  label: string,
  value: number | string,
  icon: React.ReactNode,
) {
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

function SitePerformancePage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const range: BetaDateRange = "28d";
  const last = mockTrafficTimeseries.at(-1);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">
            Site performance
          </h1>
          <p className="text-muted-foreground">
            A beta view inspired by Search Console (mocked for last {range}).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Last {range}</Badge>
          <Button asChild variant="outline">
            <Link
              params={{ organizationSlug, projectSlug }}
              to="/$organizationSlug/$projectSlug/beta/clusters/site-recommendations"
            >
              View recommendations
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {metricRow(
          "Clicks",
          last?.clicks ?? 0,
          <Icons.Hand className="size-4" />,
        )}
        {metricRow(
          "Impressions",
          last?.impressions ?? 0,
          <Icons.EyeOn className="size-4" />,
        )}
        {metricRow(
          "CTR",
          `${Math.round((last?.ctr ?? 0) * 100 * 10) / 10}%`,
          <Icons.Target className="size-4" />,
        )}
        {metricRow(
          "Avg position",
          last?.position ?? 0,
          <Icons.ArrowDown className="size-4" />,
        )}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="font-medium text-sm">
              Clicks &amp; impressions over time
            </CardTitle>
            <Badge variant="secondary">Beta</Badge>
          </div>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ReChartContainer className="h-full w-full" config={chartConfig}>
            <AreaChart data={mockTrafficTimeseries}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                axisLine={false}
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
              />
              <YAxis
                axisLine={false}
                tick={{ fontSize: 11 }}
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
                cursor={{ strokeDasharray: "3 3" }}
              />
              <Area
                dataKey="impressions"
                dot={false}
                fill="var(--color-impressions)"
                fillOpacity={0.12}
                name="Impressions"
                stroke="var(--color-impressions)"
                strokeWidth={2}
                type="monotone"
              />
              <Area
                dataKey="clicks"
                dot={false}
                fill="var(--color-clicks)"
                fillOpacity={0.22}
                name="Clicks"
                stroke="var(--color-clicks)"
                strokeWidth={2}
                type="monotone"
              />
              <ReChartLegend
                align="center"
                content={
                  <ReChartLegendContent
                    nameKey="dataKey"
                    verticalAlign="bottom"
                  />
                }
                verticalAlign="bottom"
              />
            </AreaChart>
          </ReChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
