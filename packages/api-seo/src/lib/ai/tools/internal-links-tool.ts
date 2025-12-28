import { COUNTRY_CODE_MAP } from "@rectangular-labs/core/schemas/project-parsers";
import { fetchSerp } from "@rectangular-labs/dataforseo";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { configureDataForSeoClient } from "../../dataforseo/utils";
import type { AgentToolDefinition } from "./utils";

const internalLinksInputSchema = type({
  query: type("string")
    .atLeastLength(1)
    .describe("Query/keyword to search for in SERP."),
  countryCode: type("string")
    .atLeastLength(2)
    .describe("2-letter country code (e.g. US, GB, CA)."),
  languageCode: type("string")
    .atLeastLength(2)
    .describe("2-letter language code (e.g. en, es)."),
});

type InternalLinksInput = typeof internalLinksInputSchema.infer;

export function createInternalLinksToolWithMetadata(targetUrl: string) {
  const internalLinks = tool({
    description:
      "Query SERP results via DataForSEO for a query, constrained to a target URL, and return the organic results.",
    inputSchema: jsonSchema<typeof internalLinksInputSchema.infer>(
      internalLinksInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async (input: InternalLinksInput) => {
      configureDataForSeoClient();

      const locationName =
        COUNTRY_CODE_MAP[input.countryCode] ?? "United States";

      const serpResult = await fetchSerp({
        keyword: input.query,
        locationName,
        languageCode: input.languageCode,
        targetUrl,
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
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "internal_links",
      toolDescription:
        "Query SERP results via DataForSEO for a query, constrained to a target URL, and return the organic results.",
      toolInstruction:
        "Provide query, countryCode, and languageCode. The tool will query SERP and return the organic results (url, title, description, extendedSnippet).",
      tool: internalLinks,
    },
  ];

  return { toolDefinitions, tools };
}
