import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { GoogleIcon, Info } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Card } from "@rectangular-labs/ui/components/ui/card";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@rectangular-labs/ui/components/ui/empty";
import { Separator } from "@rectangular-labs/ui/components/ui/separator";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { linkGoogleAccountForGsc } from "~/lib/auth";

type GscProperty =
  RouterOutputs["integrations"]["gsc"]["listProperties"]["properties"][number];

interface GscConnectionFormProps {
  projectId: string;
  organizationSlug: string;
  onClose: () => void;
  inline?: boolean;
}

export function GscConnectionForm({
  projectId,
  organizationSlug,
  onClose,
  inline = false,
}: GscConnectionFormProps) {
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
      refetchOnMount: true,
    }),
  );

  // Get current connected property
  const { data: connectedData } = useQuery(
    api.integrations.gsc.getConnectedPropertyForProject.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
      },
    }),
  );

  // Auto-select the currently connected property
  const currentlyConnected = useMemo(() => {
    if (!connectedData?.integration?.config) return null;
    return connectedData.integration.config.domain;
  }, [connectedData]);

  // Connect property
  const { mutate: connectProperty, isPending: isConnecting } = useMutation(
    api.integrations.gsc.connectToProject.mutationOptions({
      onSuccess: () => {
        toast.success("Google Search Console connected!");
        void queryClient.invalidateQueries({
          queryKey:
            api.integrations.gsc.getConnectedPropertyForProject.queryKey({
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

  // Disconnect property
  const { mutate: disconnectProperty, isPending: isDisconnecting } =
    useMutation(
      api.integrations.gsc.disconnectFromProject.mutationOptions({
        onSuccess: () => {
          toast.success("Google Search Console disconnected!");
          void queryClient.invalidateQueries({
            queryKey:
              api.integrations.gsc.getConnectedPropertyForProject.queryKey({
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

  const handleLinkGoogle = useCallback(() => {
    // Build callback URL with provider query param so the modal reopens after OAuth
    const url = new URL(window.location.href);
    url.searchParams.set("provider", "google-search-console");
    void linkGoogleAccountForGsc({ callbackURL: url.toString() });
  }, []);

  const handleConnect = () => {
    if (!selectedProperty) {
      toast.error("Please select a property first.");
      return;
    }

    connectProperty({
      organizationIdentifier: organizationSlug,
      projectId,
      accountId: selectedProperty.accountId,
      domain: selectedProperty.domain,
      propertyType: selectedProperty.type,
      permissionLevel: selectedProperty.permissionLevel,
    });
  };

  const handleDisconnect = () => {
    disconnectProperty({
      organizationIdentifier: organizationSlug,
      projectId,
    });
  };

  const isPending = isConnecting || isDisconnecting;

  // Show empty state if no Google account
  if (!isLoading && propertiesData && !propertiesData.hasGoogleAccount) {
    return (
      <Empty className={inline ? "border-0 p-4" : ""}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GoogleIcon />
          </EmptyMedia>
          <EmptyTitle>Connect Your Google Account</EmptyTitle>
          <EmptyDescription>
            Link your Google account to access Search Console data and track
            your content's search performance.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGoogle}>
            <GoogleIcon className="mr-2 size-4" />
            Connect Google
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  // Show empty state if no GSC scopes
  if (!isLoading && propertiesData && !propertiesData.hasGscScopes) {
    return (
      <Empty className={inline ? "border-0 p-4" : ""}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GoogleIcon />
          </EmptyMedia>
          <EmptyTitle>Grant Search Console Access</EmptyTitle>
          <EmptyDescription>
            Your Google account is connected, but we need additional permissions
            to access Search Console data. Click below to grant access.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={handleLinkGoogle}>
            <GoogleIcon className="mr-2 size-4" />
            Grant Search Console Access
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground text-sm">
          Loading properties...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-destructive">Failed to load properties</p>
        <Button onClick={() => refetch()} variant="outline">
          Retry
        </Button>
      </div>
    );
  }

  const properties = propertiesData?.properties ?? [];

  if (properties.length === 0) {
    return (
      <Empty className={inline ? "border-0 p-4" : ""}>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <GoogleIcon />
          </EmptyMedia>
          <EmptyTitle>No Properties Found</EmptyTitle>
          <EmptyDescription>
            No Search Console properties found for your account. Make sure your
            website is added to{" "}
            <a
              className="underline"
              href="https://search.google.com/search-console"
              rel="noopener noreferrer"
              target="_blank"
            >
              Google Search Console
            </a>
            .
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => refetch()} variant="outline">
            Refresh Properties
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        Select a Search Console property to connect to this project.
      </p>

      <div className="max-h-64 space-y-2 overflow-y-auto">
        {properties.map((property) => {
          const isSelected = selectedProperty?.domain === property.domain;
          const isCurrentlyConnected = currentlyConnected === property.domain;
          const isDisabled = property.permissionLevel === "needs-verification";

          return (
            <Card
              className={`cursor-pointer p-3 transition-colors ${
                isDisabled
                  ? "cursor-not-allowed opacity-60"
                  : "hover:bg-accent/50"
              } ${
                isSelected || isCurrentlyConnected
                  ? "border-primary bg-accent/30 ring-1 ring-primary"
                  : isDisabled
                    ? ""
                    : "hover:border-primary"
              }`}
              key={property.domain}
              onClick={() => !isDisabled && setSelectedProperty(property)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 space-y-1">
                  <p className="font-medium text-sm">{property.domain}</p>
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-secondary px-2 py-0.5 text-muted-foreground text-xs">
                      {property.type === "DOMAIN" ? "Domain" : "URL Prefix"}
                    </span>
                    <span
                      className={`text-xs ${
                        property.permissionLevel === "read-only" ||
                        property.permissionLevel === "needs-verification"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {property.permissionLevel === "write" && "Full Access"}
                      {property.permissionLevel === "read-only" && "Read Only"}
                      {property.permissionLevel === "needs-verification" &&
                        "Needs Verification"}
                    </span>
                    {isCurrentlyConnected && (
                      <span className="text-primary text-xs">• Connected</span>
                    )}
                  </div>
                  {property.permissionLevel === "read-only" && (
                    <p className="flex items-center gap-1 text-muted-foreground text-xs">
                      <Info className="size-3" /> Read-only access may limit
                      some features
                    </p>
                  )}
                </div>
                {(isSelected || isCurrentlyConnected) && (
                  <svg
                    aria-label="Selected"
                    className="size-5 text-primary"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <title>Selected</title>
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        {currentlyConnected ? (
          <Button
            disabled={isPending}
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
          disabled={isPending || !selectedProperty}
          isLoading={isConnecting}
          onClick={handleConnect}
        >
          {currentlyConnected ? "Update" : "Connect"}
        </Button>
      </div>
    </div>
  );
}
