import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { IntegrationProvider } from "@rectangular-labs/core/schemas/integration-parsers";
import { Badge } from "@rectangular-labs/ui/components/ui/badge";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  DialogDrawer,
  DialogDrawerDescription,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import { useState } from "react";
import { IntegrationConnectionCard } from "./integration-connection-card";
import {
  INTEGRATION_METADATA,
  type IntegrationMetadata,
} from "./integration-metadata";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

export interface IntegrationCardGridProps {
  providers: [IntegrationProvider, IntegrationMetadata][];
  integrations: IntegrationSummary[];
  hasIntegrations: boolean;
  organizationId: string;
  projectId: string;
  initialProvider?: IntegrationProvider | null;
  onDialogClose?: () => void;
  onConnectionComplete?: () => void;
}

export function IntegrationCardGrid({
  providers,
  integrations,
  hasIntegrations,
  organizationId,
  projectId,
  initialProvider = null,
  onDialogClose,
  onConnectionComplete,
}: IntegrationCardGridProps) {
  const [selectedProvider, setSelectedProvider] =
    useState<IntegrationMetadata | null>(
      initialProvider ? INTEGRATION_METADATA[initialProvider] : null,
    );

  const closeDialog = () => {
    setSelectedProvider(null);
    onDialogClose?.();
  };

  const handleConnectionComplete = () => {
    setSelectedProvider(null);
    onConnectionComplete?.();
    onDialogClose?.();
  };

  return (
    <>
      {providers.map(([provider, meta]) => {
        const existingIntegration = integrations.find(
          (integration) => integration.provider === provider,
        );
        const isConnected =
          existingIntegration?.status === "active" ||
          existingIntegration?.status === "error";
        const hasError =
          existingIntegration?.status === "error" ||
          !!existingIntegration?.lastError;

        return (
          <Card className="flex flex-col" key={provider}>
            <CardHeader className="flex-1 space-y-4 pb-4">
              <div className="flex items-start justify-between">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-lg border bg-muted/50">
                  {meta.icon}
                </div>
                <Button
                  onClick={() => setSelectedProvider(meta)}
                  size="sm"
                  variant={isConnected ? "default" : "outline"}
                >
                  {isConnected ? "Manage Connection" : "+ Connect"}
                </Button>
              </div>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <CardTitle className="font-semibold text-base">
                    {meta.name}
                  </CardTitle>
                  {hasError && <Badge variant="destructive">Error</Badge>}
                </div>
                <Badge variant="secondary">
                  {meta.category === "publishing"
                    ? "Publishing"
                    : "Data Source"}
                </Badge>
              </div>
              <CardDescription className="line-clamp-2 text-sm">
                {meta.description}
              </CardDescription>
            </CardHeader>
          </Card>
        );
      })}

      <DialogDrawer
        className="max-w-lg"
        onOpenChange={(open) => {
          if (!open && selectedProvider) {
            closeDialog();
          }
        }}
        open={!!selectedProvider}
      >
        {selectedProvider && (
          <>
            <DialogDrawerHeader>
              <DialogDrawerTitle className="flex items-center gap-2">
                {selectedProvider.icon}
                {selectedProvider.name}
              </DialogDrawerTitle>
              <DialogDrawerDescription>
                {selectedProvider.description}
              </DialogDrawerDescription>
            </DialogDrawerHeader>
            <IntegrationConnectionCard
              existingIntegration={integrations.find(
                (integration) =>
                  integration.provider === selectedProvider.provider,
              )}
              hasIntegrations={hasIntegrations}
              onComplete={handleConnectionComplete}
              organizationId={organizationId}
              projectId={projectId}
              provider={selectedProvider.provider}
            />
          </>
        )}
      </DialogDrawer>
    </>
  );
}
