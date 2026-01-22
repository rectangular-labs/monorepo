import type { Result } from "@rectangular-labs/result";
import { type } from "arktype";
import type { ArticleType } from "./content-parsers";

// Provider enum - single source of truth
export const PUBLISH_DESTINATION_PROVIDERS = [
  "shopify",
  "github",
  "webhook",
] as const;
export const DATA_SOURCE_PROVIDERS = ["google-search-console"] as const;

export const INTEGRATION_PROVIDERS = [
  ...PUBLISH_DESTINATION_PROVIDERS,
  ...DATA_SOURCE_PROVIDERS,
] as const;
export const integrationProvidersSchema = type.enumerated(
  ...INTEGRATION_PROVIDERS,
);
export type IntegrationProvider = (typeof INTEGRATION_PROVIDERS)[number];

export const INTEGRATION_STATUSES = [
  "active",
  "disconnected",
  "error",
  "pending_setup",
] as const;
export type IntegrationStatus = (typeof INTEGRATION_STATUSES)[number];

// ═══════════════════════════════════════════════════════════════════════
// PUBLISH DESTINATIONS CONFIGURATIONS
// ═══════════════════════════════════════════════════════════════════════
export const githubConfigSchema = type({
  provider: "'github'",
  repository: "string", // "owner/repo"
  branch: "string", // "main"
  basePath: "string", // "content/blog/"
  mode: "'pull_request' | 'commit'",
  "frontmatterMapping?": type({
    "title?": "string",
    "description?": "string",
    "slug?": "string",
    "primaryKeyword?": "string",
    "date?": "string",
    "image?": "string",
    "imageCaption?": "string",
    "keywords?": "string",
    "articleType?": "string",
  }),
});
export type GitHubConfig = typeof githubConfigSchema.infer;

export const shopifyConfigSchema = type({
  provider: "'shopify'",
  // Store identification
  shopDomain: "string", // "cool-store.myshopify.com"
  adminUrl: type("string.url").narrow(
    (data, ctx): data is `https://admin.shopify.com${string}` => {
      return (
        data.startsWith("https://admin.shopify.com") ||
        ctx.reject("a string starting with 'https://'")
      );
    },
  ), // "https://admin.shopify.com/store/cool-store"
  // Publish settings
  "blogId?": "string | null",
  "blogTitle?": "string | null",
  "authorId?": "string | null",
  "publishAsHtml?": "boolean",
});
export type ShopifyConfig = typeof shopifyConfigSchema.infer;

export const webhookConfigSchema = type({
  provider: "'webhook'",
  url: type("string.url").narrow((data, ctx): data is `https://${string}` => {
    if (!data.startsWith("https://")) {
      return ctx.reject("a string starting with 'https://'");
    }
    const parsed = new URL(data);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return ctx.reject("a string starting with 'https://'");
    }
    return true;
  }),
  method: "'POST' | 'PUT'",
  "headers?": "Record<string, string>",
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

// ═══════════════════════════════════════════════════════════════════════
// CREDENTIAL SCHEMAS
// ═══════════════════════════════════════════════════════════════════════
export const shopifyCredentialsSchema = type({
  provider: "'shopify'",
  clientId: "string",
  clientSecret: "string",
  "accessToken?": "string",
  "refreshToken?": "string",
  // OAuth state (temporary, removed after setup)
  "_oauthState?": "string",
});
export type ShopifyCredentials = typeof shopifyCredentialsSchema.infer;

export const webhookCredentialsSchema = type({
  provider: "'webhook'",
  "secretHeaderName?": "string", // default "X-Webhook-Signature"
  "secret?": "string", // secret string that will be included in the request
});
export type WebhookCredentials = typeof webhookCredentialsSchema.infer;

export const integrationCredentialsSchema = shopifyCredentialsSchema.or(
  webhookCredentialsSchema,
);
export type IntegrationCredentials = typeof integrationCredentialsSchema.infer;

// ═══════════════════════════════════════════════════════════════════════
// ADAPTER INTERFACES
// ═══════════════════════════════════════════════════════════════════════
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
  healthCheck(
    config: IntegrationConfig,
    credentials?: IntegrationCredentials,
  ): Promise<
    Result<{
      ok: true;
    }>
  >;
  publish(
    config: IntegrationConfig,
    content: ContentPayload,
    credentials?: IntegrationCredentials,
  ): Promise<
    Result<{
      externalId: string;
      externalUrl: string | undefined;
      handle: string | undefined;
    }>
  >;
}
