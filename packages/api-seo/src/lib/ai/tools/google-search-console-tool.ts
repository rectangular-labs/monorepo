import {
  getSearchAnalyticsArgsSchema,
  NO_SEARCH_CONSOLE_ERROR_MESSAGE,
  type seoGscPropertyTypeSchema,
} from "@rectangular-labs/core/schemas/gsc-property-parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import type { AgentToolDefinition } from "./utils";

const gscQueryInputSchema = getSearchAnalyticsArgsSchema.omit(
  "siteType",
  "siteUrl",
);

export function createGscToolWithMetadata({
  accessToken,
  siteUrl,
  siteType,
}: {
  accessToken: string | null;
  siteUrl: string | null;
  siteType: typeof seoGscPropertyTypeSchema.infer | null;
}) {
  const gscTool = tool({
    description:
      "Query the project's Google Search Console account for searchAnalytics for a given date range.",
    inputSchema: jsonSchema<typeof gscQueryInputSchema.infer>(
      gscQueryInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute(props) {
      console.log("getSearchAnalytics", {
        siteUrl,
        siteType,
        ...props,
      });
      if (!accessToken || !siteUrl || !siteType) {
        return {
          success: false,
          next_step: NO_SEARCH_CONSOLE_ERROR_MESSAGE,
        };
      }
      const result = await getSearchAnalytics(accessToken, {
        siteUrl,
        siteType,
        ...props,
      });

      if (!result.ok) {
        throw new Error(`GSC error: ${result.error.message}`);
      }

      return { ...result.value, success: true };
    },
  });

  const tools = {
    google_search_console_query: gscTool,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "google_search_console_query",
      toolDescription:
        "Query Google Search Console searchAnalytics for the project site.",
      toolInstruction:
        "Use for performance/CTR/decay analysis. Provide date range, dimensions (e.g. ['query','page']), rowLimit, and filters. If it returns success:false with next_step, switch to helping connect GSC.",
      tool: gscTool,
    },
  ];

  return { toolDefinitions, tools };
}
