"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
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
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import { Link } from "@tanstack/react-router";

const chartConfig = {
  clicks: {
    label: "Clicks",
    color: "var(--chart-1)",
  },
  impressions: {
    label: "Impressions",
    color: "var(--chart-2)",
  },
};

function formatNumber(
  value: number | undefined,
  maximumFractionDigits = 0,
): string {
  if (value === undefined) return "-";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}

function formatChange(change: number | undefined): string {
  if (change === undefined) return "";
  if (change === 0) return "No change";
  const sign = change > 0 ? "+" : "-";
  return `${sign}${formatNumber(Math.abs(change), 2)}%`;
}

export function TrafficOverview({
  metrics,
  isLoading,
  error,
  retry,
}: {
  metrics: RouterOutputs["project"]["metrics"] | undefined;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
}) {
  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">Total Clicks</CardTitle>
            <Icons.Hand className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-8 w-20" />}
            {error && <div>-</div>}
            {metrics?.clicks && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl">
                  {formatNumber(metrics.clicks.current)}
                </span>
                {typeof metrics.clicks.changePercentage === "number" && (
                  <span
                    className={
                      metrics.clicks.changePercentage > 0
                        ? "text-emerald-500 text-xs"
                        : metrics.clicks.changePercentage < 0
                          ? "text-red-500 text-xs"
                          : "text-muted-foreground text-xs"
                    }
                  >
                    {formatChange(metrics.clicks.changePercentage)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="font-medium text-sm">
              Total Impressions
            </CardTitle>
            <Icons.EyeOn className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            {isLoading && <Skeleton className="h-8 w-20" />}
            {error && <div>-</div>}
            {metrics?.impressions && (
              <div className="flex items-baseline gap-2">
                <span className="font-bold text-2xl">
                  {formatNumber(metrics.impressions.current)}
                </span>
                {typeof metrics.impressions.changePercentage === "number" && (
                  <span
                    className={
                      metrics.impressions.changePercentage > 0
                        ? "text-emerald-500 text-xs"
                        : metrics.impressions.changePercentage < 0
                          ? "text-red-500 text-xs"
                          : "text-muted-foreground text-xs"
                    }
                  >
                    {formatChange(metrics.impressions.changePercentage)}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="font-medium text-sm">
            Clicks &amp; Impressions over time
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          {isLoading && <Skeleton className="h-full w-full" />}
          {!isLoading && !error && !metrics?.timeseries && (
            <div className="flex h-full items-center justify-center">
              <p className="flex items-center gap-2 text-muted-foreground">
                <Button asChild variant="outline">
                  <Link
                    from="/$organizationSlug/$projectSlug"
                    search={{
                      provider: "google-search-console",
                    }}
                    to="/$organizationSlug/$projectSlug/settings/integrations"
                  >
                    <Icons.GoogleIcon className="h-4 w-4" />
                    Connect Google Search Console
                  </Link>
                </Button>{" "}
                to see your traffic over time here.
              </p>
            </div>
          )}
          {error && (
            <div className="flex h-full flex-col items-center justify-center gap-4">
              <p className="text-muted-foreground">
                Something went wrong while loading your traffic data.
              </p>
              <Button onClick={retry} variant="outline">
                <Icons.RotateCcw aria-hidden className="size-4" />
                Try again
              </Button>
            </div>
          )}
          {metrics?.timeseries && (
            <ReChartContainer className="h-full w-full" config={chartConfig}>
              <AreaChart data={metrics.timeseries}>
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
                  dataKey="impressions"
                  dot={false}
                  fill="var(--color-impressions)"
                  fillOpacity={0.16}
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
          )}
        </CardContent>
      </Card>
    </>
  );
}
