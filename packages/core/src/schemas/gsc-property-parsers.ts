import { type } from "arktype";

export const NO_SEARCH_CONSOLE_ERROR_MESSAGE =
  "No Google Search Console account connected. Please call the manage_google_search_property tool to allow the user to connect an account to the project and try again.";

export const seoGscPermissionLevelSchema = type(
  "'write'|'read-only'|'needs-verification'",
);
export const seoGscPropertyTypeSchema = type("'URL_PREFIX'|'DOMAIN'");

// SCHEMA FOR GSC QUERY
export const gscBaseDimensionSchema = type(
  "'query'|'page'|'country'|'device'|'searchAppearance'",
).describe(
  "Base reporting dimension for grouping/filtering. Excludes 'date' and 'hour'.",
);

export const gscDimensionSchema = type(
  "'query'|'page'|'country'|'device'|'searchAppearance'|'date'|'hour'",
).describe(
  "Reporting dimension to group by (query, page, country, device, searchAppearance, date, hour).",
);

export const gscSearchTypeSchema = type(
  "'discover'|'googleNews'|'news'|'video'|'image'|'web'",
).describe(
  [
    "Type of Google surface being queried",
    '"news": results in the News tab.',
    '"googleNews": results in news.google.com and Google News apps (not the News tab).',
    '"web": combined (“All”) tab; excludes Discover/Google News.',
  ].join(" "),
);

export const gscAggregationTypeSchema = type(
  "'auto'|'byNewsShowcasePanel'|'byPage'|'byProperty'",
).describe(
  [
    "Aggregation for the response. Default: 'auto'.",
    '"auto": service decides the appropriate aggregation.',
    '"byNewsShowcasePanel": aggregate by News Showcase panel; requires NEWS_SHOWCASE searchAppearance and type=discover or type=googleNews; incompatible with grouping/filtering by page or other searchAppearance.',
    '"byPage": aggregate values by URI.',
    '"byProperty": aggregate values by property; not supported for type=discover or type=googleNews.',
  ].join(" "),
);

export const gscFilterOperatorSchema = type(
  "'equals'|'notEquals'|'contains'|'notContains'|'includingRegex'|'excludingRegex'",
).describe(
  [
    "Filter operator for dimension filters.",
    '"equals": case-sensitive for page/query.',
    '"notEquals": case-sensitive for page/query.',
    '"contains": dimension must contain or equal expression (case-insensitive).',
    '"notContains": dimension must not contain expression (case-insensitive).',
    '"includingRegex": RE2 regex that must match.',
    '"excludingRegex": RE2 regex that must not match.',
  ].join(" "),
);

export const gscFilterSchema = type({
  dimension: gscBaseDimensionSchema.describe(
    "The value for the filter to match or exclude, depending on the operator.",
  ),
  operator: gscFilterOperatorSchema,
  expression: type("string").describe(
    "Value or pattern used by the operator to include/exclude rows.",
  ),
}).describe("A single dimension filter.");

export const getSearchAnalyticsArgsSchema = type({
  siteUrl: type("string"),
  siteType: seoGscPropertyTypeSchema,
  startDate: type(/^\d{4}-\d{2}-\d{2}$/).describe(
    "Start date for the query window in YYYY-MM-DD format.",
  ),
  endDate: type(/^\d{4}-\d{2}-\d{2}$/).describe(
    "End date for the query window in YYYY-MM-DD format.",
  ),
  "dimensions?": gscDimensionSchema.array(),
  "type?": gscSearchTypeSchema,
  "aggregationType?": gscAggregationTypeSchema,
  "rowLimit?": type("number").atMost(500).describe("Max rows to return."),
  "startRow?": type("number")
    .atLeast(0)
    .describe("Starting row for pagination."),
  "filters?": gscFilterSchema.array(),
});
