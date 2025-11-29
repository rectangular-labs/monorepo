"use client";

import {
  BarList,
  type BarListProps,
} from "@rectangular-labs/ui/components/charts/bar-list";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DropDrawer,
  DropDrawerContent,
  DropDrawerItem,
  DropDrawerTrigger,
} from "@rectangular-labs/ui/components/ui/dropdrawer";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@rectangular-labs/ui/components/ui/pagination";
import { Skeleton } from "@rectangular-labs/ui/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@rectangular-labs/ui/components/ui/tabs";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import type { DateRange } from "./date-range-selector";

function formatNumber(value: number, maximumFractionDigits = 0): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits,
  }).format(value);
}
type Metric = "clicks" | "impressions" | "ctr";
type Sort = "ascending" | "descending";

function LoadingSkeleton() {
  return (
    <div className="grid gap-1.5 pt-2">
      <Skeleton className="h-8 w-full" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-8 w-1/3" />
    </div>
  );
}

function DataEmptyState({ onRetry }: { onRetry: () => void }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Icons.CircleSlash />
        </EmptyMedia>
        <EmptyTitle>No data available.</EmptyTitle>
        <EmptyDescription>
          Try adjusting the date range to try again.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={onRetry}>
          <Icons.RotateCcw className="size-4" />
          Reload Data
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function TabContent({
  data,
  showNotAvailable,
  isLoading,
  error,
  retry,
  sort,
  metric,
  itemsPerPage,
  currentPage,
  onPageChange,
  onItemsPerPageChange,
}: {
  data?: (BarListProps["data"][number] & {
    ctr: number;
    clicks: number;
    impressions: number;
  })[];
  showNotAvailable?: boolean;
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  sort: Sort;
  metric: Metric;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
}) {
  // Sort and paginate data - hooks must be called before early returns
  const sortedData = useMemo(() => {
    if (!data) return [];
    const sorted = [...data].sort((a, b) => {
      return sort === "ascending" ? a.value - b.value : b.value - a.value;
    });
    return sorted;
  }, [data, sort]);
  const maxValue =
    sort === "ascending" ? sortedData.at(-1)?.value : sortedData.at(0)?.value;

  if (showNotAvailable) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icons.CircleSlash />
          </EmptyMedia>
          <EmptyTitle>Country Breakdown Not Available</EmptyTitle>
          <EmptyDescription>
            Country breakdown is only available when connected to Google Search
            Console.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button asChild>
            <Link
              from="/$organizationSlug/$projectSlug"
              to="/$organizationSlug/$projectSlug/settings"
            >
              <Icons.GoogleIcon className="size-4" />
              Connect Google Search Console
            </Link>
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (isLoading || error) {
    return (
      <LoadingError
        className="pt-2"
        error={error}
        errorTitle="Error loading data"
        isLoading={isLoading}
        loadingComponent={<LoadingSkeleton />}
        onRetry={retry}
      />
    );
  }

  if (data?.length === 0) {
    return <DataEmptyState onRetry={retry} />;
  }

  const totalPages = Math.max(1, Math.ceil(sortedData.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const valueFormatter = (
    v: number,
    item: NonNullable<typeof data>[number],
  ) => {
    if (metric === "ctr") {
      return `${formatNumber(v * 100, 1)}% CTR (${formatNumber(item.clicks)} clicks, ${formatNumber(item.impressions)} imp)`;
    }
    return `${formatNumber(v, 0)} ${metric} (${formatNumber(item.ctr * 100, 1)}% ctr)`;
  };

  return (
    <div className="space-y-4">
      <BarList
        className="pt-2"
        data={paginatedData}
        maxValue={maxValue}
        sortOrder="none"
        valueFormatter={valueFormatter}
      />
      {totalPages > 1 && (
        <Pagination className="justify-end">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                className={
                  currentPage === 1 ? "pointer-events-none opacity-50" : ""
                }
                onClick={() => {
                  if (currentPage > 1) {
                    onPageChange(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                className={
                  currentPage === totalPages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
                onClick={() => {
                  if (currentPage < totalPages) {
                    onPageChange(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-muted-foreground text-sm">
                {startIndex + 1}-{Math.min(endIndex, sortedData.length)} of{" "}
                {sortedData.length}
              </span>
            </PaginationItem>
            <PaginationItem>
              <DropDrawer>
                <DropDrawerTrigger asChild>
                  <Button size="sm" variant="outline">
                    {itemsPerPage} per page
                  </Button>
                </DropDrawerTrigger>
                <DropDrawerContent>
                  {[10, 25, 50, 100].map((items) => (
                    <DropDrawerItem
                      key={items}
                      onSelect={() => {
                        onItemsPerPageChange(items);
                        onPageChange(1);
                      }}
                    >
                      {items} per page
                    </DropDrawerItem>
                  ))}
                </DropDrawerContent>
              </DropDrawer>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

type Tab = "query" | "page" | "country" | "device";
export function DataTabs({
  dateRange,
  projectId,
  organizationId,
}: {
  dateRange: DateRange;
  projectId: string;
  organizationId: string;
}) {
  const [tab, setTab] = useState<Tab>("query");
  const [metric, setMetric] = useState<Metric>("clicks");
  const [sort, setSort] = useState<Sort>("descending");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error,
    refetch,
  } = useQuery(
    getApiClientRq().project.metrics.queryOptions({
      input: {
        organizationIdentifier: organizationId,
        identifier: projectId,
        dateRange,
        dimensions: [tab],
      },
      enabled: !!organizationId && !!projectId,
      staleTime: 1000 * 60 * 60 * 6, // 6 hours
      gcTime: 1000 * 60 * 60 * 24, // 24 hours
    }),
  );

  return (
    <div className="mt-4 space-y-3">
      <Tabs onValueChange={(value) => setTab(value as Tab)} value={tab}>
        <div className="flex justify-between">
          <TabsList>
            <TabsTrigger value="query">Queries</TabsTrigger>
            <TabsTrigger value="page">Pages</TabsTrigger>
            <TabsTrigger value="country">Countries</TabsTrigger>
            <TabsTrigger value="device">Devices</TabsTrigger>
          </TabsList>
          <div className="flex items-center gap-2">
            <ToggleGroup
              onValueChange={(value) => {
                setMetric(value as Metric);
                setCurrentPage(1);
              }}
              type="single"
              value={metric}
            >
              <ToggleGroupItem
                aria-label="toggle clicks"
                size={"sm"}
                title="Clicks"
                value="clicks"
                variant={"outline"}
              >
                <Icons.Hand className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                aria-label="toggle impressions"
                size={"sm"}
                title="Impressions"
                value="impressions"
                variant={"outline"}
              >
                <Icons.EyeOn className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                aria-label="toggle click through rate"
                size={"sm"}
                title="Click Through Rate"
                value="ctr"
                variant={"outline"}
              >
                <Icons.TrendingUp className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              onClick={() =>
                setSort(sort === "ascending" ? "descending" : "ascending")
              }
              size="icon-sm"
              title={
                sort === "ascending" ? "Sort descending" : "Sort ascending"
              }
              variant="outline"
            >
              {sort === "ascending" && (
                <Icons.FilterAscending className="size-4" />
              )}
              {sort === "descending" && (
                <Icons.FilterDescending className="size-4" />
              )}
            </Button>
          </div>
        </div>
        <TabsContent value="query">
          <TabContent
            currentPage={currentPage}
            data={metrics?.queries?.map((row) => {
              let value = row.clicks;
              if (metric === "impressions") {
                value = row.impressions;
              } else if (metric === "ctr") {
                value = row.ctr;
              }
              return {
                name: row.value,
                value,
                ctr: row.ctr,
                clicks: row.clicks,
                impressions: row.impressions,
              };
            })}
            error={error}
            isLoading={isLoadingMetrics}
            itemsPerPage={itemsPerPage}
            metric={metric}
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
            retry={refetch}
            showNotAvailable={false}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="page">
          <TabContent
            currentPage={currentPage}
            data={metrics?.pages?.map((row) => {
              let value = row.clicks;
              if (metric === "impressions") {
                value = row.impressions;
              } else if (metric === "ctr") {
                value = row.ctr;
              }
              return {
                name: row.url,
                value,
                ctr: row.ctr,
                clicks: row.clicks,
                impressions: row.impressions,
              };
            })}
            error={error}
            isLoading={isLoadingMetrics}
            itemsPerPage={itemsPerPage}
            metric={metric}
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
            retry={refetch}
            showNotAvailable={false}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="country">
          <TabContent
            currentPage={currentPage}
            data={metrics?.country?.map((row) => {
              let value = row.clicks;
              if (metric === "impressions") {
                value = row.impressions;
              } else if (metric === "ctr") {
                value = row.ctr;
              }
              return {
                name: row.name,
                value,
                ctr: row.ctr,
                clicks: row.clicks,
                impressions: row.impressions,
              };
            })}
            error={error}
            isLoading={isLoadingMetrics}
            itemsPerPage={itemsPerPage}
            metric={metric}
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
            retry={refetch}
            showNotAvailable={metrics?.source === "dfs"}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="device">
          <TabContent
            currentPage={currentPage}
            data={metrics?.device?.map((row) => {
              let value = row.clicks;
              if (metric === "impressions") {
                value = row.impressions;
              } else if (metric === "ctr") {
                value = row.ctr;
              }
              return {
                name: row.type,
                value,
                ctr: row.ctr,
                clicks: row.clicks,
                impressions: row.impressions,
              };
            })}
            error={error}
            isLoading={isLoadingMetrics}
            itemsPerPage={itemsPerPage}
            metric={metric}
            onItemsPerPageChange={setItemsPerPage}
            onPageChange={setCurrentPage}
            retry={refetch}
            showNotAvailable={metrics?.source === "dfs"}
            sort={sort}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
