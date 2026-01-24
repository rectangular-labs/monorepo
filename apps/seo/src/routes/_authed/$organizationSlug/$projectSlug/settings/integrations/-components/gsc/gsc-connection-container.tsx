import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { GscConnectionForm as GscPropertyPicker } from "~/routes/_authed/$organizationSlug/$projectSlug/settings/integrations/-components/gsc/gsc-connection-form";

type GscProperty =
  RouterOutputs["integrations"]["gsc"]["listProperties"]["properties"][number];
type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

export function GscConnectionContainer({
  projectId,
  organizationSlug,
  existingIntegration,
  onClose,
}: {
  projectId: string;
  organizationSlug: string;
  existingIntegration?: IntegrationSummary;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const api = getApiClientRq();

  const [selectedProperty, setSelectedProperty] = useState<GscProperty | null>(
    null,
  );

  // Fetch GSC properties - always refetch on mount to pick up newly connected accounts
  const {
    data: propertiesData,
    isLoading,
    error,
    refetch,
  } = useQuery(
    api.integrations.gsc.listProperties.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
      },
      refetchOnMount: true,
    }),
  );

  const { data: projectData } = useQuery(
    api.project.get.queryOptions({
      input: {
        identifier: projectId,
        organizationIdentifier: organizationSlug,
      },
    }),
  );

  const currentlyConnected = useMemo(() => {
    if (
      !existingIntegration?.config ||
      existingIntegration.config.provider !== "google-search-console"
    ) {
      return null;
    }
    return existingIntegration.config.domain;
  }, [existingIntegration]);

  const { mutate: createIntegration, isPending: isCreating } = useMutation(
    api.integrations.create.mutationOptions({
      onSuccess: () => {
        toast.success("Google Search Console connected!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to connect: ${error.message}`);
      },
    }),
  );

  const { mutate: updateIntegration, isPending: isUpdating } = useMutation(
    api.integrations.update.mutationOptions({
      onSuccess: () => {
        toast.success("Google Search Console updated!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update: ${error.message}`);
      },
    }),
  );

  const { mutate: removeIntegration, isPending: isRemoving } = useMutation(
    api.integrations.remove.mutationOptions({
      onSuccess: () => {
        toast.success("Google Search Console disconnected!");
        void queryClient.invalidateQueries({
          queryKey: api.integrations.list.queryKey({
            input: { organizationIdentifier: organizationSlug, projectId },
          }),
        });
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to disconnect: ${error.message}`);
      },
    }),
  );

  const handleConnect = () => {
    if (!selectedProperty) {
      toast.error("Please select a property first.");
      return;
    }

    const config = {
      provider: "google-search-console" as const,
      domain: selectedProperty.domain,
      propertyType: selectedProperty.type,
      permissionLevel: selectedProperty.permissionLevel,
    };

    if (existingIntegration) {
      updateIntegration({
        id: existingIntegration.id,
        projectId,
        organizationIdentifier: organizationSlug,
        accountId: selectedProperty.accountId,
        name: selectedProperty.domain,
        config,
      });
    } else {
      createIntegration({
        projectId,
        organizationIdentifier: organizationSlug,
        accountId: selectedProperty.accountId,
        name: selectedProperty.domain,
        config,
      });
    }
  };

  const handleDisconnect = () => {
    if (!existingIntegration) return;
    removeIntegration({
      id: existingIntegration.id,
      projectId,
      organizationIdentifier: organizationSlug,
    });
  };
  const isInserting = isCreating || isUpdating;

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select a Search Console property to connect to this project.
      </p>

      <GscPropertyPicker
        error={error}
        existingIntegration={existingIntegration}
        isLoading={isLoading}
        onRetry={refetch}
        projectWebsiteUrl={projectData?.websiteUrl}
        propertiesData={propertiesData}
        property={selectedProperty}
        setProperty={setSelectedProperty}
      />

      <Separator />

      <div className="flex items-center justify-between">
        {currentlyConnected ? (
          <Button
            disabled={isInserting}
            isLoading={isRemoving}
            onClick={handleDisconnect}
            type="button"
            variant="destructive"
          >
            Disconnect
          </Button>
        ) : (
          <div />
        )}
        <Button
          disabled={isRemoving || !selectedProperty}
          isLoading={isInserting}
          onClick={handleConnect}
        >
          {currentlyConnected ? "Update" : "Connect"}
        </Button>
      </div>
    </div>
  );
}
