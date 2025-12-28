import type { getSearchAnalyticsArgsSchema } from "@rectangular-labs/core/schemas/gsc-property-parsers";
import { err, ok, type Result } from "@rectangular-labs/result";
import { makeGscRequest } from "./google-search-console.fetch";

export interface GscProperty {
  domain: string;
  type: "URL_PREFIX" | "DOMAIN";
  permissionLevel:
    | "siteFullUser"
    | "siteRestrictedUser"
    | "siteOwner"
    | "siteUnverifiedUser";
}

interface GscSitesListResponse {
  siteEntry?: Array<{
    siteUrl?: string;
    permissionLevel?: string;
  }>;
}
/**
 * List all GSC properties the user has access to
 */
export async function listProperties(
  accessToken: string,
): Promise<Result<GscProperty[], Error>> {
  const response = await makeGscRequest<GscSitesListResponse>(
    accessToken,
    "/sites",
  );

  if (!response.ok) {
    return err(response.error);
  }

  const properties: GscProperty[] = (response.value.siteEntry || [])
    .filter((entry) => !!entry.siteUrl)
    .map((entry) => {
      const siteUrl = entry.siteUrl;
      if (!siteUrl) {
        throw new Error("BAD STATE: Site URL is required");
      }

      return {
        domain: siteUrl.startsWith("sc-domain:") ? siteUrl.slice(10) : siteUrl,
        type: siteUrl.startsWith("sc-domain:")
          ? ("DOMAIN" as const)
          : ("URL_PREFIX" as const),
        permissionLevel:
          (entry.permissionLevel as GscProperty["permissionLevel"]) ??
          "siteUnverifiedUser",
      };
    });

  return ok(properties);
}

export interface GscSearchAnalyticsResponse {
  rows: Array<{
    keys: string[];
    clicks: number;
    impressions: number;
    ctr: number;
    position: number;
  }>;
  responseAggregationType: "auto" | "byProperty" | "byPage";
}
/**
 * Get search analytics for a specific GSC property
 *
 * @param accessToken - Google OAuth access token
 * @param args.siteUrl - The GSC property URL (e.g., "https://example.com/")
 * @param args.siteType - The type of GSC property (URL_PREFIX or DOMAIN)
 * @param args.startDate - Start date of the query window
 * @param args.endDate - End date of the query window
 * @param args.dimensions default: ["query"] - Dimensions to group by (query, page, country, device, searchAppearance)
 * @param args.type default: "web" - The type of search to perform (discover, googleNews, news, video, image, web).
 * @param args.aggregationType default: "auto" - The type of aggregation to use (auto, byProperty, byPage, byNewsShowcasePanel).
 * @param args.filters - Dimension filters to apply
 * @param args.filters.dimension - The dimension to filter by (query, page, country, device, searchAppearance)
 * @param args.filters.operator - The operator to use (equals, notEquals, contains, notContains, includingRegex, excludingRegex)
 * @param args.filters.expression - The value for the filter to match or exclude, depending on the operator.
 * @param args.rowLimit default: 1000 - Max rows to return (max 25000)
 * @param args.startRow default: 0 - Starting row for pagination
 */
export async function getSearchAnalytics(
  accessToken: string,
  args: typeof getSearchAnalyticsArgsSchema.infer,
): Promise<Result<GscSearchAnalyticsResponse, Error>> {
  const requestBody = {
    startDate: args.startDate,
    endDate: args.endDate,
    type: args.type ?? "web",
    dimensions: args.dimensions ?? ["query"],
    aggregationType: args.aggregationType ?? "auto",
    rowLimit: Math.min(args.rowLimit ?? 1_000, 25_000), // GSC API max: 25,000
    startRow: args.startRow ?? 0,
    ...(args.filters?.length
      ? {
          dimensionFilterGroups: [
            {
              filters: args.filters.map((f) => ({
                dimension: f.dimension,
                operator: f.operator,
                expression: f.expression,
              })),
            },
          ],
        }
      : {}),
  };

  // URL encode the siteUrl for the endpoint
  const encodedSiteUrl = encodeURIComponent(
    args.siteType === "DOMAIN" ? `sc-domain:${args.siteUrl}` : args.siteUrl,
  );
  const response = await makeGscRequest<GscSearchAnalyticsResponse>(
    accessToken,
    `/sites/${encodedSiteUrl}/searchAnalytics/query`,
    {
      method: "POST",
      body: requestBody,
    },
  );
  if (!response.ok) {
    return err(response.error);
  }

  return ok({
    rows: response.value.rows,
    responseAggregationType: response.value.responseAggregationType,
  });
}

/**
 * Get keywords a specific page ranks for
 */
export function getKeywordsForPage(
  accessToken: string,
  args: {
    siteUrl: string;
    siteType: GscProperty["type"];
    pageUrl: string;
    startDate: string;
    endDate: string;
  },
): Promise<Result<GscSearchAnalyticsResponse, Error>> {
  return getSearchAnalytics(accessToken, {
    siteUrl: args.siteUrl,
    siteType: args.siteType,
    startDate: args.startDate,
    endDate: args.endDate,
    dimensions: ["query"],
    filters: [
      {
        dimension: "page",
        operator: "equals",
        expression: args.pageUrl,
      },
    ],
  });
}

/**
 * Get top pages by clicks
 */
export function getTopPages(
  accessToken: string,
  args: {
    siteUrl: string;
    siteType: GscProperty["type"];
    startDate: string;
    endDate: string;
    limit?: number;
  },
): Promise<Result<GscSearchAnalyticsResponse, Error>> {
  return getSearchAnalytics(accessToken, {
    siteUrl: args.siteUrl,
    siteType: args.siteType,
    startDate: args.startDate,
    endDate: args.endDate,
    dimensions: ["page"],
    rowLimit: args.limit || 1000,
  });
}

/**
 * Helper to format dates for GSC API (YYYY-MM-DD)
 */
function formatGscDate(date: Date): string {
  return date.toISOString().split("T")[0] ?? "";
}

/**
 * Get date range for last N days
 */
export function getLastNDaysRange(days: number): {
  startDate: string;
  endDate: string;
} {
  const endDate = new Date();
  const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  return {
    startDate: formatGscDate(startDate),
    endDate: formatGscDate(endDate),
  };
}
