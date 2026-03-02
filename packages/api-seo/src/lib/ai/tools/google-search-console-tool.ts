import {
  getSearchAnalyticsArgsSchema,
  gscFilterSchema,
  NO_SEARCH_CONSOLE_ERROR_MESSAGE,
} from "@rectangular-labs/core/schemas/gsc-property-parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { jsonSchema, tool } from "ai";

const gscQueryInputSchema = jsonSchema<
  Omit<typeof getSearchAnalyticsArgsSchema.infer, "siteUrl" | "siteType">
>({
  type: "object",
  additionalProperties: false,
  required: ["startDate", "endDate"],
  properties: {
    startDate: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      description: getSearchAnalyticsArgsSchema.get("startDate").description,
    },
    endDate: {
      type: "string",
      pattern: "^\\d{4}-\\d{2}-\\d{2}$",
      description: getSearchAnalyticsArgsSchema.get("endDate").description,
    },
    dimensions: {
      type: "array",
      items: {
        type: "string",
        enum: [
          "query",
          "page",
          "country",
          "device",
          "searchAppearance",
          "date",
          "hour",
        ],
        description: getSearchAnalyticsArgsSchema.get("dimensions").description,
      },
    },
    type: {
      type: "string",
      enum: ["discover", "googleNews", "news", "video", "image", "web"],
      description: getSearchAnalyticsArgsSchema.get("type").description,
    },
    aggregationType: {
      type: "string",
      enum: ["auto", "byNewsShowcasePanel", "byPage", "byProperty"],
      description:
        getSearchAnalyticsArgsSchema.get("aggregationType").description,
    },
    rowLimit: {
      type: "number",
      maximum: 500,
      description: getSearchAnalyticsArgsSchema.get("rowLimit").description,
    },
    startRow: {
      type: "number",
      minimum: 0,
      description: getSearchAnalyticsArgsSchema.get("startRow").description,
    },
    filters: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["dimension", "operator", "expression"],
        properties: {
          dimension: {
            type: "string",
            enum: ["query", "page", "country", "device", "searchAppearance"],
            description: gscFilterSchema.get("dimension").description,
          },
          operator: {
            type: "string",
            enum: [
              "equals",
              "notEquals",
              "contains",
              "notContains",
              "includingRegex",
              "excludingRegex",
            ],
            description: gscFilterSchema.get("operator").description,
          },
          expression: {
            type: "string",
            description: gscFilterSchema.get("expression").description,
          },
        },
        description: gscFilterSchema.description,
      },
    },
  },
});

export function createGscTool({
  accessToken,
  siteUrl,
  siteType,
}: {
  accessToken: string | null;
  siteUrl: string | null;
  siteType: "URL_PREFIX" | "DOMAIN" | null;
}) {
  const gscTool = tool({
    description: `Query the project's Google Search Console account for searchAnalytics for a given date range.
Use for performance/CTR/decay analysis. Provide date range, dimensions, rowLimit, and filters.
If this returns success:false with next_step, switch to helping connect GSC.`,
    inputSchema: gscQueryInputSchema,
    inputExamples: [
      {
        input: {
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          dimensions: ["query", "page"],
          rowLimit: 100,
        },
      },
      {
        input: {
          startDate: "2025-11-01",
          endDate: "2025-11-30",
          dimensions: ["page"],
          type: "web",
          filters: [
            {
              dimension: "page",
              operator: "contains",
              expression: "/blog/",
            },
          ],
        },
      },
    ],
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
  return { tools };
}
