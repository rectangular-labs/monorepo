import type { Result } from "@rectangular-labs/result";
import { type } from "arktype";
import type { ArticleType } from "./content-parsers";

// Provider enum - single source of truth
const PUBLISH_DESTINATION_PROVIDERS = ["shopify", "github", "webhook"] as const;
const DATA_SOURCE_PROVIDERS = ["google-search-console"] as const;

export const INTEGRATION_PROVIDERS = [
  ...PUBLISH_DESTINATION_PROVIDERS,
  ...DATA_SOURCE_PROVIDERS,
] as const;
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = [
  "active",
  "disconnected",
  "error",
  "pending_setup",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

export function isPublishDestination(provider: IntegrationProvider): boolean {
  return PUBLISH_DESTINATION_PROVIDERS.includes(
    provider as (typeof PUBLISH_DESTINATION_PROVIDERS)[number],
  );
}

export function isDataSource(provider: IntegrationProvider): boolean {
  return DATA_SOURCE_PROVIDERS.includes(
    provider as (typeof DATA_SOURCE_PROVIDERS)[number],
  );
}

// ═══════════════════════════════════════════════════════════════════════
// PUBLISH DESTINATIONS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════
export const githubConfigSchema = type({
  provider: "'github'",
  repository: "string", // "owner/repo"
  branch: "string", // "main"
  basePath: "string", // "content/blog/"
  mode: "'pull_request' | 'commit'",
});
export type GitHubConfig = typeof githubConfigSchema.infer;

export const shopifyConfigSchema = type({
  provider: "'shopify'",
  // Store identification
  shopDomain: "string", // "cool-store.myshopify.com"
  adminUrl: "string", // "https://admin.shopify.com/store/cool-store"
  // OAuth credentials (from user's custom app)
  clientId: "string",
  accessToken: "string", // Obtained after OAuth
  // Publish settings
  "blogId?": "string | null",
  "blogTitle?": "string | null",
  "authorId?": "string | null",
  "publishAsHtml?": "boolean",
  // OAuth state (temporary, removed after setup)
  "_pendingClientSecret?": "string",
  "_oauthState?": "string",
});
export type ShopifyConfig = typeof shopifyConfigSchema.infer;

export const webhookConfigSchema = type({
  provider: "'webhook'",
  url: "string.url",
  method: "'POST' | 'PUT'",
  "headers?": "Record<string, string>",
  // HMAC signature for verification
  "secretHeaderName?": "string", // default "X-Webhook-Signature"
  "secret?": "string", // HMAC secret string that will be included in the request
});
export type WebhookConfig = typeof webhookConfigSchema.infer;

// ═══════════════════════════════════════════════════════════════════════
// DATA SOURCES CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════
export const gscConfigSchema = type({
  provider: "'google-search-console'",
  domain: "string",
  propertyType: "'URL_PREFIX' | 'DOMAIN'",
  permissionLevel: "'write' | 'read-only' | 'needs-verification'",
});
export type GscConfig = typeof gscConfigSchema.infer;

export const integrationConfigSchema = githubConfigSchema
  .or(shopifyConfigSchema)
  .or(webhookConfigSchema)
  .or(gscConfigSchema);
export type IntegrationConfig = typeof integrationConfigSchema.infer;

export interface ContentPayload {
  slug: string;
  title: string;
  description: string;
  primaryKeyword: string;
  heroImage?: string | null;
  heroImageCaption?: string | null;
  contentMarkdown: string;
  publishedAt: Date;
  articleType: ArticleType;
}
export interface PublishAdapter {
  provider: IntegrationProvider;
  healthCheck(config: WebhookConfig): Promise<
    Result<{
      ok: true;
    }>
  >;
  publish(
    config: IntegrationConfig,
    content: ContentPayload,
  ): Promise<
    Result<{
      externalId: string;
      externalUrl: string | undefined;
      handle: string | undefined;
    }>
  >;
}

// Type guard helpers
export function isGitHubConfig(
  config: IntegrationConfig,
): config is GitHubConfig {
  return config.provider === "github";
}
export function isShopifyConfig(
  config: IntegrationConfig,
): config is ShopifyConfig {
  return config.provider === "shopify";
}
export function isWebhookConfig(
  config: IntegrationConfig,
): config is WebhookConfig {
  return config.provider === "webhook";
}
export function isGscConfig(config: IntegrationConfig): config is GscConfig {
  return config.provider === "google-search-console";
}
