import {
  type IntegrationProvider,
  integrationProvidersSchema,
  PUBLISH_DESTINATION_PROVIDERS,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { Filter, Search } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { type } from "arktype";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { FilterStatus } from "../../-components/filter-status";
import { IntegrationCardGrid } from "./-components/integration-card-grid";
import {
  INTEGRATION_METADATA,
  type IntegrationCategory,
  type IntegrationMetadata,
} from "./-components/integration-metadata";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/integrations/",
)({
  component: RouteComponent,
  validateSearch: type({
    "provider?": integrationProvidersSchema,
  }),
});

function RouteComponent() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const api = getApiClientRq();
  const search = Route.useSearch();

  const { data: project } = useSuspenseQuery(
    api.project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    "all" | IntegrationCategory
  >("all");

  // Fetch existing integrations for this project
  const { data: integrationsData, isLoading } = useQuery(
    api.integrations.list.queryOptions({
      input: {
        organizationIdentifier: project.organizationId,
        projectId: project.id,
      },
    }),
  );
  const integrations = integrationsData?.integrations ?? [];
  const hasPublishingIntegrations = integrations.some((integration) =>
    PUBLISH_DESTINATION_PROVIDERS.includes(
      integration.provider as (typeof PUBLISH_DESTINATION_PROVIDERS)[number],
    ),
  );

  // Filter providers by search query and category
  const filteredProviders = useMemo(() => {
    let providers = Object.entries(INTEGRATION_METADATA) as [
      IntegrationProvider,
      IntegrationMetadata,
    ][];

    // Filter by category
    if (categoryFilter !== "all") {
      providers = providers.filter(
        ([, meta]) => meta.category === categoryFilter,
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      providers = providers.filter(
        ([, meta]) =>
          meta.name.toLowerCase().includes(query) ||
          meta.description.toLowerCase().includes(query),
      );
    }

    return providers;
  }, [searchQuery, categoryFilter]);

  const handleCloseModal = () => {
    // Update URL to remove provider param
    window.history.replaceState(null, "", window.location.pathname);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-semibold text-2xl tracking-tight">Integrations</h2>
        <p className="text-muted-foreground">
          Connect external services to publish content and track performance.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-10"
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search integrations..."
            value={searchQuery}
          />
        </div>
        <FilterStatus
          label="Filter by type"
          onChange={setCategoryFilter}
          options={[
            { value: "all", label: "All" },
            { value: "publishing", label: "Publishing" },
            { value: "data-source", label: "Data Source" },
          ]}
          value={categoryFilter}
        >
          <Button size="icon" variant="outline">
            <Filter />
          </Button>
        </FilterStatus>
      </div>

      {/* Integration Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading integrations...</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <IntegrationCardGrid
            hasIntegrations={hasPublishingIntegrations}
            initialProvider={search.provider ?? null}
            integrations={integrations}
            onDialogClose={handleCloseModal}
            organizationId={project.organizationId}
            projectId={project.id}
            providers={filteredProviders}
          />
        </div>
      )}

      {/* Empty state */}
      {!isLoading && filteredProviders.length === 0 && (
        <div className="py-12 text-center">
          <p className="text-muted-foreground">
            No integrations found matching &quot;{searchQuery}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
