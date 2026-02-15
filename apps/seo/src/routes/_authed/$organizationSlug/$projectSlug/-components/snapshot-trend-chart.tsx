import { formatShortDate } from "@rectangular-labs/core/format/date";
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
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { type ComponentType, useEffect, useMemo, useState } from "react";

export type SnapshotMetric = "clicks" | "impressions" | "ctr" | "avgPosition";

export type SnapshotMetricAggregate = {
  avgPosition: number;
  clicks: number;
  ctr: number;
  impressions: number;
};

type SnapshotTrendSeriesPoint<
  T extends SnapshotMetricAggregate = SnapshotMetricAggregate,
> = {
  aggregate: T;
  takenAt: string | Date;
};

const OVERVIEW_CHART_CONFIG = {
  value: {
    color: "var(--chart-1)",
    label: "Value",
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
    title: "CTR",
    value: "ctr",
  },
  {
    ariaLabel: "toggle position",
    icon: Icons.Target,
    title: "Position",
    value: "avgPosition",
  },
];

function getMetricTitle(metric: SnapshotMetric) {
  if (metric === "impressions") return "Impressions overview";
  if (metric === "ctr") return "CTR overview";
  if (metric === "avgPosition") return "Average Position overview";
  return "Clicks overview";
}

function getMetricTooltipLabel(metric: SnapshotMetric) {
  if (metric === "impressions") return "impressions";
  if (metric === "ctr") return "ctr";
  if (metric === "avgPosition") return "avg position";
  return "clicks";
}

function formatMetricValue(metric: SnapshotMetric, value: number) {
  if (metric === "ctr") {
    return `${new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(value)}%`;
  }

  if (metric === "avgPosition") {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: 1,
    }).format(value);
  }

  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}

export function getSnapshotMetricValue(
  aggregate: SnapshotMetricAggregate,
  metric: SnapshotMetric,
  options?: { ctrMultiplier?: number },
): number {
  const ctrMultiplier = options?.ctrMultiplier ?? 1;
  if (metric === "impressions") return aggregate.impressions;
  if (metric === "ctr") return aggregate.ctr * ctrMultiplier;
  if (metric === "avgPosition") return aggregate.avgPosition;
  return aggregate.clicks;
}

export function SnapshotTrendChart<T extends SnapshotMetricAggregate>({
  ctrMultiplier,
  emptyMessage,
  initialMetric = "clicks",
  onMetricChange,
  series,
}: {
  ctrMultiplier?: number;
  emptyMessage: string;
  initialMetric?: SnapshotMetric;
  onMetricChange?: (metric: SnapshotMetric) => void;
  series: SnapshotTrendSeriesPoint<T>[];
}) {
  const [metric, setMetric] = useState<SnapshotMetric>(initialMetric);

  useEffect(() => {
    setMetric(initialMetric);
  }, [initialMetric]);

  const chartPoints = useMemo(
    () =>
      series.map((point) => ({
        date: formatShortDate(
          point.takenAt instanceof Date
            ? point.takenAt
            : new Date(point.takenAt),
        ),
        value: getSnapshotMetricValue(point.aggregate, metric, {
          ctrMultiplier,
        }),
      })),
    [ctrMultiplier, metric, series],
  );

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">{getMetricTitle(metric)}</CardTitle>
          <ToggleGroup
            onValueChange={(value) => {
              if (!value) return;
              const nextMetric = value as SnapshotMetric;
              setMetric(nextMetric);
              onMetricChange?.(nextMetric);
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
        </div>
      </CardHeader>
      <CardContent className="h-[280px]">
        {chartPoints.length === 0 ? (
          <div className="flex h-full items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            {emptyMessage}
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
                    formatter={(value) => {
                      if (typeof value !== "number") {
                        return null;
                      }

                      return (
                        <div className="flex w-full items-center justify-between gap-2">
                          <span className="text-muted-foreground">
                            {getMetricTooltipLabel(metric)}
                          </span>
                          <span className="font-medium font-mono text-foreground tabular-nums">
                            {formatMetricValue(metric, value)}
                          </span>
                        </div>
                      );
                    }}
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
