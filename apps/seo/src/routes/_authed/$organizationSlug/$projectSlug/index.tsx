import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { ConnectGscBanner } from "./-components/connect-gsc-banner";
import { DataTabs } from "./-components/data-tabs";
import {
  type DateRange,
  DateRangeSelector,
} from "./-components/date-range-selector";
import { TrafficOverview } from "./-components/traffic-overview";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/",
)({
  component: PageComponent,
});

function PageComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const [dateRange, setDateRange] = useState<DateRange>("28d");

  const { data: activeProject } = useSuspenseQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const {
    data: metrics,
    isLoading: isLoadingMetrics,
    error,
    refetch,
  } = useQuery(
    getApiClientRq().project.metrics.queryOptions({
      input: {
        organizationIdentifier: activeProject.organizationId,
        identifier: activeProject.id,
        dateRange,
        dimensions: ["overview"],
      },
      enabled: !!activeProject.organizationId && !!activeProject.id,
    }),
  );

  return (
    <div className="w-full space-y-6 p-6">
      <div className="flex w-full items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-bold text-3xl tracking-tight">
            {activeProject?.name ?? "Project overview"}
          </h1>
          <p className="text-muted-foreground">
            Monitor clicks, impressions, and top queries for this project.
          </p>
        </div>
        <DateRangeSelector onChange={setDateRange} value={dateRange} />
      </div>

      {metrics?.source === "dfs" && <ConnectGscBanner />}
      <TrafficOverview
        error={error}
        isLoading={isLoadingMetrics}
        metrics={metrics}
        retry={refetch}
      />

      <DataTabs
        dateRange={dateRange}
        organizationId={activeProject.organizationId}
        projectId={activeProject.id}
      />
    </div>
  );
}
