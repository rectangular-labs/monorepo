import { google } from "@ai-sdk/google";
import type { schema } from "@rectangular-labs/db";
import { generateText, jsonSchema, Output, stepCountIs, tool } from "ai";
import type { InitialContext } from "../../../types";
import {
  configureDataForSeoClient,
  fetchSerpWithCache,
  getLocationAndLanguage,
} from "../../dataforseo/utils";
import { logAgentStep } from "../utils/log-agent-step";

export function createWebTools(
  project: typeof schema.seoProject.$inferSelect,
  cacheKV: InitialContext["cacheKV"],
) {
  configureDataForSeoClient();
  const { locationName, languageCode } = getLocationAndLanguage(project);

  const webFetch = tool({
    description:
      "Fetch a webpage and answer a specific query regarding a webpage.",
    inputSchema: jsonSchema<{
      url: string;
      query: string;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["url", "query"],
      properties: {
        url: {
          type: "string",
          description: "The URL to fetch.",
        },
        query: {
          type: "string",
          description: "What to find or answer from the page content.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          url: "https://developers.google.com/search/docs/fundamentals/seo-starter-guide",
          query: "Summarize how Google recommends writing useful titles.",
        },
      },
      {
        input: {
          url: "https://example.com/pricing",
          query: "Extract only the monthly pricing tiers and limits.",
        },
      },
    ],
    async execute({ url, query }) {
      const prompt = [
        "Fetch the page content using url_context and answer the query.",
        "Provide a direct answer first, then supporting text that cites or paraphrases the page.",
        "Exclude navigation, footer, cookie banners, and unrelated boilerplate.",
        "Do not add commentary beyond the answer and supporting text from the page.",
        "If the query is not related to the page, return 'No relevant information found.'",
        "If the page is not accessible or we have any issues fetching it, return with a relevant message to let the agent know and suggest it to use the web_search tool to find an alternative page.",
        `URL: ${url}`,
        `Query: ${query}`,
      ].join("\n");
      const { text } = await generateText({
        model: google("gemini-3-flash-preview"),
        system: "You are a precise web content extractor.",
        prompt,
        tools: {
          url_context: google.tools.urlContext({}),
        },
        onStepFinish: (step) => {
          logAgentStep(console.log, "web fetch step", step);
        },
        stopWhen: [stepCountIs(25)],
      }).catch((error) => {
        console.error("Error in web fetch", error);
        return { text: null };
      });
      if (!text?.trim()) {
        return {
          success: false,
          error: "Failed to fetch page content.",
        };
      }
      const cleaned = text.trim();
      return {
        success: true,
        answer: cleaned,
        url,
      };
    },
  });

  const webSearch = tool({
    description:
      "Run a live web search for up-to-date information. This tool uses the web to find the latest information  based off the the given instruction and queries.",
    inputSchema: jsonSchema<{
      instruction: string;
      queries: string[];
    }>({
      type: "object",
      additionalProperties: false,
      required: ["instruction", "queries"],
      properties: {
        instruction: {
          type: "string",
          description:
            "The instruction for what the web search should focus on. Keep it focused on a singular goal or topic. Break out multiple goals into multiple instructions via multiple web_search tool calls.",
        },
        queries: {
          type: "array",
          minItems: 1,
          description: "Search queries that will help fulfill the instruction.",
          items: {
            type: "string",
          },
        },
      },
    }),
    inputExamples: [
      {
        input: {
          instruction:
            "Find reliable sources comparing AI content detection false positives.",
          queries: [
            "ai content detector false positives study",
            "llm detector reliability research",
          ],
        },
      },
      {
        input: {
          instruction:
            "Find current guidance on internal linking for large websites.",
          queries: [
            "internal linking best practices large sites",
            "site architecture internal links seo",
          ],
        },
      },
    ],
    async execute({ instruction, queries }) {
      if (queries.length === 0) {
        return {
          success: false,
          error: "No queries provided for web search.",
        };
      }

      const serpResponses = await Promise.all(
        queries.map(async (keyword) => {
          const serpResult = await fetchSerpWithCache({
            keyword,
            locationName,
            languageCode,
            cacheKV,
          });
          if (!serpResult.ok) {
            throw new Error(
              "Failed to fetch SERP data from the keyword research data source.",
              { cause: serpResult.error },
            );
          }
          return {
            query: keyword,
            result: serpResult.value.searchResult ?? [],
          };
        }),
      );

      const organicResults = serpResponses.flatMap(({ query, result }) => ({
        result: result
          .filter((item) => item.type === "organic")
          .map((item) => ({
            url: item.url ?? "",
            title: item.title ?? "",
            description: item.description ?? "",
            extendedSnippet: item.extendedSnippet ?? "",
          })),
        query,
      }));

      const prompt = `Use the SERP data and url_context tool to answer the instruction.
Read as many sites as needed to produce accurate, cited information.
Return JSON only in the format: { results: [{ url, siteGroundingText, relevantInformation }] }.
Each result should map to a URL you actually accessed via the url_context tool.

## Instruction

${instruction}

## Organic SERP results

${organicResults
  .map(
    (item) =>
      `- Query: ${item.query}
${item.result
  .map(
    (r) => `  - URL: ${r.url}
    Title: ${r.title}
    Description: ${r.description}
    Snippet: ${r.extendedSnippet}`,
  )
  .join("\n")}`,
  )
  .join("\n")}`;

      const { output: object } = await generateText({
        model: google("gemini-3-flash-preview"),
        output: Output.object({
          schema: jsonSchema<{
            results: {
              url: string;
              siteGroundingText: string;
              relevantInformation: string;
            }[];
          }>({
            type: "object",
            additionalProperties: false,
            required: ["results"],
            properties: {
              results: {
                type: "array",
                description: "Array of relevant web search results.",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["url", "siteGroundingText", "relevantInformation"],
                  properties: {
                    url: {
                      type: "string",
                      description:
                        "The URL of the site that contains the relevant information.",
                    },
                    siteGroundingText: {
                      type: "string",
                      description: "Grounding text pulled from the site.",
                    },
                    relevantInformation: {
                      type: "string",
                      description:
                        "Relevant information that helps fulfill the instruction.",
                    },
                  },
                },
              },
            },
          }),
        }),
        system: "You are a precise research assistant.",
        prompt,
        tools: {
          url_context: google.tools.urlContext({}),
        },
        onStepFinish: (step) => {
          logAgentStep(console.log, "web search step", step);
        },
        stopWhen: [stepCountIs(25)],
      });

      if (object.results.length === 0) {
        return {
          success: false,
          error: "Failed to find relevant information from SERP results.",
        };
      }

      return {
        success: true,
        queries,
        result: object.results,
      };
    },
  });

  const tools = { web_fetch: webFetch, web_search: webSearch } as const;
  return { tools };
}
