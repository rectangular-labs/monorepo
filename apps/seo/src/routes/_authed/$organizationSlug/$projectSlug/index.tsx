import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { getApiClientRq } from "~/lib/api";
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

function ConnectGscBanner() {
  return (
    <Alert variant="warning">
      <Icons.AlertTriangleIcon />
      <AlertTitle>Estimated Data</AlertTitle>
      <AlertDescription>
        <p>
          Data is estimated by combining search volume and estimated traffic
          from various data providers. These numbers are directional only.
        </p>
        <p>
          <Link
            className="underline"
            from="/$organizationSlug/$projectSlug"
            search={{ provider: "google-search-console" }}
            to="/$organizationSlug/$projectSlug/settings/integrations"
          >
            Connect
          </Link>{" "}
          your Google Search Console property to unlock up to date data.
        </p>
      </AlertDescription>
    </Alert>
  );
}

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
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
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
    </main>
  );
}
