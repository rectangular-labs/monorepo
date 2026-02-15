import { formatNullableNumber } from "@rectangular-labs/core/format/number";
import { formatNullablePercent } from "@rectangular-labs/core/format/percent";
import { BarList } from "@rectangular-labs/ui/components/charts/bar-list";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@rectangular-labs/ui/components/ui/pagination";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { type ComponentType, useEffect } from "react";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import {
  getSnapshotMetricValue,
  type SnapshotMetric,
} from "./snapshot-trend-chart";

export type TopKeywordsSortOrder = "asc" | "desc";

export type TopKeywordRow = {
  keyword: string;
  clicks: number;
  impressions: number;
  ctr?: number | null;
  avgPosition?: number | null;
  position?: number | null;
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

export function TopKeywords({
  rows,
  metric,
  sortOrder,
  page,
  pageSize,
  searchInput,
  onMetricChange,
  onSortOrderChange,
  onPageChange,
  onPageSizeChange,
  onSearchInputChange,
  isLoading = false,
  error = null,
  onRetry,
  emptyMessage = "No keyword data for the selected filters.",
  title = "Top keywords",
}: {
  rows: TopKeywordRow[];
  metric: SnapshotMetric;
  sortOrder: TopKeywordsSortOrder;
  page: number;
  pageSize: number;
  searchInput: string;
  onMetricChange: (metric: SnapshotMetric) => void;
  onSortOrderChange: (sortOrder: TopKeywordsSortOrder) => void;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSearchInputChange: (value: string) => void;
  isLoading?: boolean;
  error?: Error | string | null;
  onRetry?: () => void;
  emptyMessage?: string;
  title?: string;
}) {
  const normalizedSearch = searchInput.trim().toLowerCase();
  const filteredRows = normalizedSearch
    ? rows.filter((row) => row.keyword.toLowerCase().includes(normalizedSearch))
    : rows;

  const sortedRows = [...filteredRows].sort((a, b) => {
    const direction = sortOrder === "asc" ? 1 : -1;
    const leftValue = getMetricValue(a, metric);
    const rightValue = getMetricValue(b, metric);
    return (leftValue - rightValue) * direction;
  });

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
          <CardTitle className="text-base">{title}</CardTitle>
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
            onChange={(event) => onSearchInputChange(event.target.value)}
            placeholder="Search keyword..."
            value={searchInput}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <LoadingError
          error={error}
          errorDescription="Could not load top keyword data."
          errorTitle="Error loading top keywords"
          isLoading={isLoading}
          loadingComponent={<Skeleton className="h-[260px] w-full" />}
          onRetry={onRetry}
        />

        {!isLoading && !error && sortedRows.length === 0 && (
          <div className="rounded-lg border border-dashed p-6 text-muted-foreground text-sm">
            {emptyMessage}
          </div>
        )}

        {!isLoading && !error && sortedRows.length > 0 && (
          <>
            <BarList
              className="pt-2"
              data={pagedRows.map((row) => ({
                key: row.keyword,
                name: row.keyword,
                value: getMetricValue(row, metric),
                clicks: row.clicks,
                impressions: row.impressions,
                ctr: getCtr(row),
                avgPosition: getAvgPosition(row),
              }))}
              sortOrder="none"
              valueFormatter={(value, item) =>
                metric === "ctr"
                  ? `${formatNullablePercent(value, { fallback: "0.0%" })} (${formatNullableNumber(item.clicks, { fallback: "0" })} clicks)`
                  : metric === "avgPosition"
                    ? `${formatNullableNumber(value, { fallback: "0", maximumFractionDigits: 1 })} (${formatNullableNumber(item.impressions, { fallback: "0" })} imp)`
                    : `${formatNullableNumber(value, { fallback: "0" })} (${formatNullablePercent(item.ctr, { fallback: "0.0%" })} ctr)`
              }
            />

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
                      currentPage < totalPages && onPageChange(currentPage + 1)
                    }
                  />
                </PaginationItem>
                <PaginationItem>
                  <span className="px-4 text-muted-foreground text-sm">
                    {`${(currentPage - 1) * pageSize + 1}-${Math.min(currentPage * pageSize, total)} of ${total}`}
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
                      {[10, 25, 50, 100].map((size) => (
                        <DropDrawerItem
                          key={size}
                          onSelect={() => onPageSizeChange(size)}
                        >
                          {size} per page
                        </DropDrawerItem>
                      ))}
                    </DropDrawerContent>
                  </DropDrawer>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function getMetricValue(row: TopKeywordRow, metric: SnapshotMetric) {
  const normalizedRow = {
    avgPosition: getAvgPosition(row),
    clicks: row.clicks,
    ctr: getCtr(row),
    impressions: row.impressions,
  };

  return getSnapshotMetricValue(normalizedRow, metric);
}

function getCtr(row: TopKeywordRow) {
  if (typeof row.ctr === "number") {
    return row.ctr;
  }
  if (row.impressions <= 0) {
    return 0;
  }
  return row.clicks / row.impressions;
}

function getAvgPosition(row: TopKeywordRow) {
  if (typeof row.avgPosition === "number") {
    return row.avgPosition;
  }
  if (typeof row.position === "number") {
    return row.position;
  }
  return 0;
}

function MetricToggle({
  metric,
  onMetricChange,
}: {
  metric: SnapshotMetric;
  onMetricChange: (metric: SnapshotMetric) => void;
}) {
  return (
    <ToggleGroup
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
