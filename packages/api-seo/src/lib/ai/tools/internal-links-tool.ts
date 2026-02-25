import { fetchSerp } from "@rectangular-labs/dataforseo";
import type { schema } from "@rectangular-labs/db";
import { jsonSchema, tool } from "ai";
import {
  configureDataForSeoClient,
  getLocationAndLanguage,
} from "../../dataforseo/utils";

export function createInternalLinksTool(
  project: typeof schema.seoProject.$inferSelect,
) {
  const { locationName, languageCode } = getLocationAndLanguage(project);
  const targetUrl = project.websiteUrl;

  const internalLinks = tool({
    description:
      "Query SERP results for a query, constrained to a target URL, and return the organic results.",
    inputSchema: jsonSchema<{
      query: string;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["query"],
      properties: {
        query: {
          type: "string",
          minLength: 1,
          description:
            "Query/keyword to search for that we want to find related content previously written on.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          query: "invoice automation software",
        },
      },
      {
        input: {
          query: "AI content generation",
        },
      },
    ],
    execute: async (input) => {
      configureDataForSeoClient();

      const serpResult = await fetchSerp({
        keyword: `${input.query} site:${targetUrl}`,
        locationName,
        languageCode,
      });

      if (!serpResult.ok) {
        return {
          success: false,
          error:
            serpResult.error instanceof Error
              ? serpResult.error.message
              : "Failed to fetch SERP results",
        };
      }

      type SearchItem = (typeof serpResult.value.searchResult)[number];
      type OrganicItem = Extract<SearchItem, { type: "organic" }>;

      return {
        success: true,
        query: input.query,
        targetUrl,
        organicResults: serpResult.value.searchResult
          .filter((item): item is OrganicItem => item.type === "organic")
          .filter(
            (item): item is OrganicItem & { url: string } =>
              typeof item.url === "string" && item.url.length > 0,
          )
          .map((item) => ({
            url: item.url,
            title: item.title ?? null,
            description: item.description ?? null,
            extendedSnippet: item.extendedSnippet ?? null,
          })),
      };
    },
  });

  const tools = { internal_links: internalLinks } as const;
  return { tools };
}
