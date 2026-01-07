import { google } from "@ai-sdk/google";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import type { AgentToolDefinition } from "./utils";

const webFetchInputSchema = type({
  url: type("string").describe("The URL to fetch."),
  query: type("string").describe(
    "What to find or answer from the page content.",
  ),
});

const webSearchInputSchema = type({
  instruction: type("string").describe(
    "The instruction for what the web search should focus on.",
  ),
  queries: type("string[]").describe(
    "The queries to that the search itself should be focused on.",
  ),
});

export function createWebToolsWithMetadata() {
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
      console.log("web fetch result", cleaned);
      return {
        success: true,
        answer: cleaned,
        url,
      };
    },
  });

  const webSearch = tool({
    description:
      "Run a live Google search for up-to-date information. This tool uses live SERP data to find the latest information on the given queries.",
    inputSchema: jsonSchema<typeof webSearchInputSchema.infer>(
      webSearchInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ instruction, queries }) {
      const searchQueries =
        queries.length > 0 ? queries : instruction ? [instruction] : [];
      if (searchQueries.length === 0) {
        return {
          success: false,
          error: "No queries provided for web search.",
        };
      }

      const prompt = [
        "Run a live web search using the google_search tool.",
        "Return the answer to the queries along with a concise list of the top sources for each query with title, URL, and one-line summary of the url.",
        "Use clear separation by query.",
        `Instruction: ${instruction}`,
        "Queries:",
        ...searchQueries.map((q) => `- ${q}`),
      ].join("\n");

      const { text } = await generateText({
        model: google("gemini-3-flash-preview"),
        system: "You are a precise research assistant.",
        prompt,
        tools: {
          google_search: google.tools.googleSearch({}),
        },
        stopWhen: [stepCountIs(25)],
      }).catch((error) => {
        console.error("Error in web search", error);
        return { text: null };
      });
      if (!text?.trim()) {
        return {
          success: false,
          error: "Failed to search.",
        };
      }

      console.log("web search result", text);

      return {
        success: true,
        queries: searchQueries,
        result: text.trim(),
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
