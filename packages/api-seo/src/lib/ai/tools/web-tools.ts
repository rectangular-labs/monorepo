import { google } from "@ai-sdk/google";
import type { schema } from "@rectangular-labs/db";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import type { InitialContext } from "../../../types";
import {
  configureDataForSeoClient,
  fetchSerpWithCache,
  getLocationAndLanguage,
} from "../../dataforseo/utils";
import type { AgentToolDefinition } from "./utils";

const webFetchInputSchema = type({
  url: type("string").describe("The URL to fetch."),
  query: type("string").describe(
    "What to find or answer from the page content.",
  ),
});

const webSearchInputSchema = type({
  instruction: type("string").describe(
    "The instruction for what the web search should focus on. The instruction should be focused on a singular goal or topic. Break out multiple goals into multiple instructions via multiple web_search tool calls.",
  ),
  queries: type("string[]").describe(
    "The queries to that the search itself should be focused on that would help fulfill the instruction.",
  ),
});

const webSearchOutputSchema = type({
  results: type({
    url: type("string").describe(
      "The URL of the site that contains the relevant information.",
    ),
    siteGroundingText: type("string").describe(
      "The text from the site that grounds the relevant information.",
    ),
    relevantInformation: type("string").describe(
      "The relevant information from the site that helps fulfill the instruction.",
    ),
  })
    .array()
    .describe("Array of relevant web search results."),
});

export function createWebToolsWithMetadata(
  project: typeof schema.seoProject.$inferSelect,
  cacheKV: InitialContext["cacheKV"],
) {
  configureDataForSeoClient();
  const { locationName, languageCode } = getLocationAndLanguage(project);

  const webFetch = tool({
    description:
      "Fetch a webpage and answer a specific query regarding a webpage.",
    inputSchema: jsonSchema<typeof webFetchInputSchema.infer>(
      webFetchInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
          console.log("web fetch step", step);
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
      "Run a live web search for up-to-date information. This tool uses the web to find the latest information on the given queries.",
    inputSchema: jsonSchema<typeof webSearchInputSchema.infer>(
      webSearchInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
              `DFS serp error: ${JSON.stringify(serpResult.error, null, 2)}`,
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

      const { experimental_output: object } = await generateText({
        model: google("gemini-3-flash-preview"),
        experimental_output: Output.object({
          schema: jsonSchema<typeof webSearchOutputSchema.infer>(
            webSearchOutputSchema.toJsonSchema() as JSONSchema7,
          ),
        }),
        system: "You are a precise research assistant.",
        prompt,
        tools: {
          url_context: google.tools.urlContext({}),
        },
        onStepFinish: (step) => {
          console.log("web search step", step);
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
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "web_fetch",
      toolDescription:
        "Fetch and render a URL, returning readable Markdown of the page.",
      toolInstruction:
        "Provide url. Use to quote/summarize competitor pages, docs, pricing, and SERP landing pages.",
      tool: webFetch,
    },
    {
      toolName: "web_search",
      toolDescription: "Run a live web search for up-to-date information.",
      toolInstruction:
        "Provide an instruction for what the web search should focus on and a list of queries to that the search itself should be focused on. Use for competitor research, definitions, current best practices, and finding relevant URLs to fetch.",
      tool: webSearch,
    },
  ];

  return { toolDefinitions, tools };
}
