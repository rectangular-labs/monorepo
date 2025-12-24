import { openai } from "@ai-sdk/openai";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import { fetchPageContent } from "../../cloudflare/fetch-page-content";
import type { AgentToolDefinition } from "./tool-definition";

const webFetchInputSchema = type({
  url: type("string").describe("The URL to fetch."),
  userAgent: type("string")
    .describe("The user agent to use for the fetch.")
    .optional(),
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
      "Fetch a webpage and extract its content as Markdown. This tool renders the page in a browser and converts it to Markdown format, which is useful for extracting readable content from web pages. You can optionally set a custom user agent if the fetch failed or blocks the request.",
    inputSchema: jsonSchema<typeof webFetchInputSchema.infer>(
      webFetchInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ url, userAgent }) {
      const result = await fetchPageContent({ url, userAgent });
      if (!result.ok) {
        return {
          success: false,
          error: result.error.message,
        };
      }

      return {
        success: true,
        markdown: result.value.markdown,
        url: result.value.url,
      };
    },
  });

  const webSearch = tool({
    description:
      "Run a live web search for up-to-date information. This tool uses the web to search for the latest information on the given queries.",
    inputSchema: jsonSchema<typeof webSearchInputSchema.infer>(
      webSearchInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ instruction, queries }) {
      const { text } = await generateText({
        model: openai("gpt-5.2"),
        system: instruction,
        messages: [
          {
            role: "user",
            content:
              queries.length > 0
                ? `Search for the following queries: ${queries.join("\n")}`
                : "Please go ahead and search for the latest information on the web.",
          },
        ],
        tools: {
          web_search: openai.tools.webSearch({
            externalWebAccess: true,
            searchContextSize: "medium",
            userLocation: {
              type: "approximate",
              city: "San Francisco",
              region: "California",
            },
          }),
        },
        stopWhen: [stepCountIs(10)],
      }).catch((e) => {
        console.error("Error in web search", e);
        return { text: null };
      });
      if (!text) {
        return {
          success: false,
          error: "Failed to search.",
        };
      }

      return {
        success: true,
        queries,
        result: text,
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
