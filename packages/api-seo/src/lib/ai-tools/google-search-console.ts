import {
  getSearchAnalyticsArgsSchema,
  NO_SEARCH_CONSOLE_ERROR_MESSAGE,
  type seoGscPropertyTypeSchema,
} from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { type JSONSchema7, jsonSchema, tool } from "ai";

const gscQueryInputSchema = getSearchAnalyticsArgsSchema.omit(
  "siteType",
  "siteUrl",
);

export function createGscTool({
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

  return {
    google_search_console_query: gscTool,
  } as const;
}
