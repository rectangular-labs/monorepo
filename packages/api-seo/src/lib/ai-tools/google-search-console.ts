import type { seoGscPropertyTypeSchema } from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";

export function createGscTool({
  accessToken,
  siteUrl,
  siteType,
}: {
  accessToken: string | null;
  siteUrl: string | null;
  siteType: typeof seoGscPropertyTypeSchema.infer | null;
}) {
  const dimensionsSchema = type(
    "'query'|'page'|'country'|'device'|'searchAppearance'",
  );
  const filterSchema = type({
    dimension: dimensionsSchema,
    operator: type("'equals'|'contains'|'notContains'"),
    expression: "string",
  });

  const gscQueryInputSchema = type({
    startDate: type("string").describe("YYYY-MM-DD"),
    endDate: type("string").describe("YYYY-MM-DD"),
    "dimensions?": dimensionsSchema.array(),
    "filters?": filterSchema.array(),
    "rowLimit?": "number",
    "startRow?": "number",
  });

  const gscTool = tool({
    description:
      "Query Google Search Console searchAnalytics for a given property and date range.",
    inputSchema: jsonSchema<typeof gscQueryInputSchema.infer>(
      gscQueryInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({
      startDate,
      endDate,
      dimensions,
      filters,
      rowLimit,
      startRow,
    }): Promise<unknown> {
      if (!accessToken || !siteUrl || !siteType) {
        throw new Error(
          "No access token provided. Please connect a Google Search Console account to the project before using this tool.",
        );
      }
      const result = await getSearchAnalytics(accessToken, {
        siteUrl,
        siteType,
        startDate,
        endDate,
        dimensions,
        filters,
        rowLimit,
        startRow,
      });

      if (!result.ok) {
        throw new Error(`GSC error: ${result.error.message}`);
      }

      return result.value as unknown;
    },
  });

  return {
    google_search_console_query: gscTool,
  } as const;
}
