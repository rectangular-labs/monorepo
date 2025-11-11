import {
  getSearchAnalyticsArgsSchema,
  NO_SEARCH_CONSOLE_ERROR_MESSAGE,
  type seoGscPropertyTypeSchema,
} from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";

const gscQueryInputSchema = getSearchAnalyticsArgsSchema.omit(
  "siteType",
  "siteUrl",
);

const manageGscPropertyInputSchema = type({
  type: "'manage'",
});

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

  const manageGscPropertyTool = tool({
    description:
      "Manage the project's Google Search Console property. This tool allows you to connect, disconnect, and manage the property.",
    inputSchema: jsonSchema<typeof manageGscPropertyInputSchema.infer>(
      manageGscPropertyInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute() {
      await Promise.resolve();
      return { status: "Pending User Action" as const };
    },
  });

  return {
    google_search_console_query: gscTool,
    manage_google_search_property: manageGscPropertyTool,
  } as const;
}
