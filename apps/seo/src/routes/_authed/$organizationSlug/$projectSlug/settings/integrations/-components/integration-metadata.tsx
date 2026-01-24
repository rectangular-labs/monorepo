import type { IntegrationProvider } from "@rectangular-labs/core/schemas/integration-parsers";
import {
  GitHubIcon,
  GoogleSearchConsoleIcon,
  Link,
} from "@rectangular-labs/ui/components/icon";

export type IntegrationCategory = "publishing" | "data-source";

export interface IntegrationMetadata {
  provider: IntegrationProvider;
  name: string;
  description: string;
  category: IntegrationCategory;
  /** Icon component for the integration */
  icon: React.ReactNode;
}

export const INTEGRATION_METADATA: Record<
  Exclude<IntegrationProvider, "shopify">,
  IntegrationMetadata
> = {
  github: {
    provider: "github",
    name: "GitHub",
    description:
      "Push your articles directly to a GitHub repository. Perfect for static site generators like Astro, Next.js, Hugo, or Jekyll.",
    category: "publishing",
    icon: <GitHubIcon className="size-6" />,
  },
  // shopify: {
  //   provider: "shopify",
  //   name: "Shopify",
  //   description:
  //     "Publish articles directly to your Shopify store's blog. Requires a custom Shopify app with Content API access.",
  //   category: "publishing",
  //   icon: <ShopifyIcon className="size-6" />,
  // },
  webhook: {
    provider: "webhook",
    name: "Webhook",
    description:
      "Send content to any HTTP endpoint. Ideal for custom workflows, headless CMS, or triggering builds.",
    category: "publishing",
    icon: <Link className="size-6" />,
  },
  "google-search-console": {
    provider: "google-search-console",
    name: "Google Search Console",
    description:
      "Track your content's search performance, including impressions, clicks, and rankings.",
    category: "data-source",
    icon: <GoogleSearchConsoleIcon className="size-6" />,
  },
} as const;

export function getIntegrationMetadata(
  provider: IntegrationProvider,
): IntegrationMetadata {
  // if (provider === "shopify") {
  //   throw new Error("Shopify integration is not supported");
  // }
  return INTEGRATION_METADATA[provider];
}
