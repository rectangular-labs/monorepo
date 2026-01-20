import type { IntegrationProvider } from "@rectangular-labs/core/schemas/integration-parsers";

export function getPublishingScopes(provider: IntegrationProvider) {
  if (provider === "github") return "repo";
  if (provider === "google-search-console") return "webmasters";
  return null;
}
