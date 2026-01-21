import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import type { IntegrationProvider } from "@rectangular-labs/core/schemas/integration-parsers";
import { GithubConnectionForm } from "./github-connection-form";
import { GscConnectionForm } from "./gsc-connection-form";
import { ShopifyConnectionForm } from "./shopify-connection-form";
import { WebhookConnectionForm } from "./webhook-connection-form";

type IntegrationSummary =
  RouterOutputs["integrations"]["list"]["integrations"][number];

export interface IntegrationConnectionCardProps {
  provider: IntegrationProvider;
  projectId: string;
  projectSlug: string;
  organizationId: string;
  organizationSlug: string;
  existingIntegration?: IntegrationSummary;
  onClose: () => void;
  /** If true, renders in a more compact inline mode (for chat panel) */
  inline?: boolean;
}

/**
 * Master component that renders the appropriate connection form based on the provider.
 * Can be used both in the settings modal and inline in the chat panel.
 */
export function IntegrationConnectionCard({
  provider,
  projectId,
  organizationSlug,
  existingIntegration,
  onClose,
  inline = false,
}: IntegrationConnectionCardProps) {
  switch (provider) {
    case "github":
      return (
        <GithubConnectionForm
          existingIntegration={existingIntegration}
          inline={inline}
          onClose={onClose}
          organizationSlug={organizationSlug}
          projectId={projectId}
        />
      );
    case "shopify":
      return (
        <ShopifyConnectionForm
          existingIntegration={existingIntegration}
          onClose={onClose}
          organizationSlug={organizationSlug}
          projectId={projectId}
        />
      );
    case "webhook":
      return (
        <WebhookConnectionForm
          existingIntegration={existingIntegration}
          onClose={onClose}
          organizationSlug={organizationSlug}
          projectId={projectId}
        />
      );
    case "google-search-console":
      return (
        <GscConnectionForm
          inline={inline}
          onClose={onClose}
          organizationSlug={organizationSlug}
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
