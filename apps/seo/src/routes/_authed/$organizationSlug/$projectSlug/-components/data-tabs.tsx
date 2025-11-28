"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { BarList } from "@rectangular-labs/ui/components/charts/bar-list";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
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
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import type { DateRange } from "./date-range-selector";

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);
}
type Metric = "clicks" | "impressions";
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

function QueriesTab({
  metrics,
  isLoading,
  error,
  retry,
  sort,
  metric,
}: {
  metrics?: RouterOutputs["project"]["metrics"];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  sort: Sort;
  metric: Metric;
}) {
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

  if (metrics?.queries?.length === 0) {
    return <DataEmptyState onRetry={retry} />;
  }

  return (
    <BarList
      className="pt-2"
      data={
        metrics?.queries?.map((row) => ({
          key: row.value,
          name: row.value,
          href: "https://test.com",
          value: metric === "clicks" ? row.clicks : row.impressions,
        })) ?? []
      }
      sortOrder={sort}
      valueFormatter={(v) => `${formatNumber(v)} ${metric}`}
    />
  );
}

function PagesTab({
  metrics,
  isLoading,
  error,
  retry,
  metric,
  sort,
}: {
  metrics?: RouterOutputs["project"]["metrics"];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  metric: Metric;
  sort: Sort;
}) {
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

  if (metrics?.pages?.length === 0) {
    return <DataEmptyState onRetry={retry} />;
  }

  return (
    <BarList
      className="pt-2"
      data={
        metrics?.pages?.map((row) => ({
          key: row.url,
          name: row.url,
          value: metric === "clicks" ? row.clicks : row.impressions,
          href: row.url,
        })) ?? []
      }
      sortOrder={sort}
      valueFormatter={(v) => `${formatNumber(v)} ${metric}`}
    />
  );
}

function CountriesTab({
  metrics,
  isLoading,
  error,
  retry,
  metric,
  sort,
}: {
  metrics?: RouterOutputs["project"]["metrics"];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  metric: Metric;
  sort: Sort;
}) {
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

  if (metrics?.source === "dfs") {
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

  if (metrics?.country?.length === 0) {
    return <DataEmptyState onRetry={retry} />;
  }

  return (
    <BarList
      className="pt-2"
      data={
        metrics?.country?.map((row) => ({
          key: row.name,
          name: row.name,
          value: metric === "clicks" ? row.clicks : row.impressions,
        })) ?? []
      }
      sortOrder={sort}
      valueFormatter={(v) => `${formatNumber(v)} ${metric}`}
    />
  );
}

function DevicesTab({
  metrics,
  isLoading,
  error,
  retry,
  metric,
  sort,
}: {
  metrics?: RouterOutputs["project"]["metrics"];
  isLoading: boolean;
  error: Error | null;
  retry: () => void;
  metric: Metric;
  sort: Sort;
}) {
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

  if (metrics?.source === "dfs") {
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

  if (metrics?.device?.length === 0) {
    return <DataEmptyState onRetry={retry} />;
  }

  return (
    <BarList
      className="pt-2"
      data={
        metrics?.device?.map((row) => ({
          key: row.type,
          name: row.type,
          value: metric === "clicks" ? row.clicks : row.impressions,
        })) ?? []
      }
      sortOrder={sort}
      valueFormatter={(v) => `${formatNumber(v)} ${metric}`}
    />
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
              onValueChange={(value) => setMetric(value as Metric)}
              type="single"
              value={metric}
            >
              <ToggleGroupItem
                aria-label="toggle clicks"
                title="Clicks"
                value="clicks"
              >
                <Icons.Hand className="size-4" />
              </ToggleGroupItem>
              <ToggleGroupItem
                aria-label="toggle impressions"
                title="Impressions"
                value="impressions"
              >
                <Icons.EyeOn className="size-4" />
              </ToggleGroupItem>
            </ToggleGroup>
            <Button
              onClick={() =>
                setSort(sort === "ascending" ? "descending" : "ascending")
              }
              size="icon"
              title={
                sort === "ascending" ? "Sort descending" : "Sort ascending"
              }
              variant="ghost"
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
          <QueriesTab
            error={error}
            isLoading={isLoadingMetrics}
            metric={metric}
            metrics={metrics}
            retry={refetch}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="page">
          <PagesTab
            error={error}
            isLoading={isLoadingMetrics}
            metric={metric}
            metrics={metrics}
            retry={refetch}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="country">
          <CountriesTab
            error={error}
            isLoading={isLoadingMetrics}
            metric={metric}
            metrics={metrics}
            retry={refetch}
            sort={sort}
          />
        </TabsContent>
        <TabsContent value="device">
          <DevicesTab
            error={error}
            isLoading={isLoadingMetrics}
            metric={metric}
            metrics={metrics}
            retry={refetch}
            sort={sort}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
