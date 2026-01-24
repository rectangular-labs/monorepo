import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { IntegrationProvider } from "@rectangular-labs/core/schemas/integration-parsers";
import { GithubConnectionForm } from "./github-connection-form";
import { GscConnectionContainer } from "./gsc/gsc-connection-container";
import { WebhookConnectionForm } from "./webhook-connection-form";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

export interface IntegrationConnectionCardProps {
  provider: IntegrationProvider;
  projectId: string;
  organizationId: string;
  existingIntegration?: IntegrationSummary;
  onComplete: () => void;
  hasIntegrations: boolean;
}

/**
 * Master component that renders the appropriate connection form based on the provider.
 * Can be used both in the settings modal and inline in the chat panel.
 */
export function IntegrationConnectionCard({
  provider,
  projectId,
  organizationId,
  existingIntegration,
  onComplete,
  hasIntegrations,
}: IntegrationConnectionCardProps) {
  switch (provider) {
    case "github":
      return (
        <GithubConnectionForm
          existingIntegration={existingIntegration}
          hasIntegrations={hasIntegrations}
          onComplete={onComplete}
          organizationId={organizationId}
          projectId={projectId}
        />
      );
    // case "shopify":
    //   return (
    //     <ShopifyConnectionForm
    //       existingIntegration={existingIntegration}
    //       hasIntegrations={hasIntegrations}
    //       onComplete={onComplete}
    //       organizationId={organizationId}
    //       projectId={projectId}
    //     />
    //   );
    case "webhook":
      return (
        <WebhookConnectionForm
          existingIntegration={existingIntegration}
          hasIntegrations={hasIntegrations}
          onComplete={onComplete}
          organizationId={organizationId}
          projectId={projectId}
        />
      );
    case "google-search-console":
      return (
        <GscConnectionContainer
          existingIntegration={existingIntegration}
          onComplete={onComplete}
          organizationId={organizationId}
          projectId={projectId}
        />
      );
    default:
      return (
        <div className="py-8 text-center text-muted-foreground">
          Unsupported integration provider.
        </div>
      );
  }
}
