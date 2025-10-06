import { err, ok, type Result, safe } from "@rectangular-labs/result";

const GSC_BASE_URL = "https://www.googleapis.com/webmasters/v3";

export interface GscProperty {
  domain: string;
  type: "URL_PREFIX" | "DOMAIN";
  permissionLevel:
    | "siteFull"
    | "siteRestricted"
    | "siteOwner"
    | "siteUnverifiedUser";
}

export interface GscAnalyticsRow {
  keys: string[]; // Values for each dimension
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

export interface GscAnalyticsResponse {
  rows: GscAnalyticsRow[];
  responseAggregationType?: "auto" | "byProperty" | "byPage";
}

/**
 * Make a request to the Google Search Console API
 */
async function makeGscRequest<T>(
  accessToken: string,
  endpoint: string,
  options?: {
    method?: "GET" | "POST";
    body?: unknown;
  },
): Promise<Result<T, Error>> {
  const url = `${GSC_BASE_URL}${endpoint}`;

  const response = await safe(async () => {
    const res = await fetch(url, {
      method: options?.method ?? "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      ...(options?.body ? { body: JSON.stringify(options.body) } : {}),
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`GSC API request failed (${res.status}): ${errorText}`);
    }

    return await res.json();
  });

  if (!response.ok) {
    return err(response.error);
  }

  return ok(response.value as T);
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

interface GscSearchAnalyticsResponse {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  responseAggregationType?: "auto" | "byProperty" | "byPage";
}

/**
 * Get search analytics for a property
 *
 * @param accessToken - Google OAuth access token
 * @param args.siteUrl - The GSC property URL (e.g., "https://example.com/")
 * @param args.startDate - Start date in YYYY-MM-DD format
 * @param args.endDate - End date in YYYY-MM-DD format
 * @param args.dimensions - Dimensions to group by (query, page, country, device, searchAppearance)
 * @param args.filters - Dimension filters to apply
 * @param args.rowLimit - Max rows to return (max 25000)
 * @param args.startRow - Starting row for pagination
 */
export async function getSearchAnalytics(
  accessToken: string,
  args: {
    siteUrl: string;
    startDate: string;
    endDate: string;
    dimensions?: Array<
      "query" | "page" | "country" | "device" | "searchAppearance"
    >;
    filters?: Array<{
      dimension: "query" | "page" | "country" | "device" | "searchAppearance";
      operator: "equals" | "contains" | "notContains";
      expression: string;
    }>;
    rowLimit?: number;
    startRow?: number;
  },
): Promise<Result<GscAnalyticsResponse, Error>> {
  const requestBody: {
    startDate: string;
    endDate: string;
    dimensions: string[];
    dimensionFilterGroups?: Array<{
      filters: Array<{
        dimension: string;
        operator: string;
        expression: string;
      }>;
    }>;
    rowLimit: number;
    startRow: number;
  } = {
    startDate: args.startDate,
    endDate: args.endDate,
    dimensions: args.dimensions || ["query"],
    rowLimit: Math.min(args.rowLimit || 25000, 25000), // GSC API max
    startRow: args.startRow || 0,
  };

  if (args.filters && args.filters.length > 0) {
    requestBody.dimensionFilterGroups = [
      {
        filters: args.filters.map((f) => ({
          dimension: f.dimension,
          operator: f.operator.toUpperCase() as
            | "EQUALS"
            | "CONTAINS"
            | "NOT_CONTAINS",
          expression: f.expression,
        })),
      },
    ];
  }

  // URL encode the siteUrl for the endpoint
  const encodedSiteUrl = encodeURIComponent(args.siteUrl);
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

  const rows: GscAnalyticsRow[] = (response.value.rows || []).map((row) => ({
    keys: row.keys ?? [],
    clicks: row.clicks ?? 0,
    impressions: row.impressions ?? 0,
    ctr: row.ctr ?? 0,
    position: row.position ?? 0,
  }));

  return ok({
    rows,
    responseAggregationType: response.value.responseAggregationType ?? "auto",
  });
}

/**
 * Get keywords a specific page ranks for
 */
export function getKeywordsForPage(
  accessToken: string,
  args: {
    siteUrl: string;
    pageUrl: string;
    startDate: string;
    endDate: string;
    minImpressions?: number;
  },
): Promise<Result<GscAnalyticsResponse, Error>> {
  return getSearchAnalytics(accessToken, {
    siteUrl: args.siteUrl,
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
    rowLimit: 25000,
  });
}

/**
 * Get top pages by clicks
 */
export function getTopPages(
  accessToken: string,
  args: {
    siteUrl: string;
    startDate: string;
    endDate: string;
    limit?: number;
  },
): Promise<Result<GscAnalyticsResponse, Error>> {
  return getSearchAnalytics(accessToken, {
    siteUrl: args.siteUrl,
    startDate: args.startDate,
    endDate: args.endDate,
    dimensions: ["page"],
    rowLimit: args.limit || 1000,
  });
}

/**
 * Helper to format dates for GSC API (YYYY-MM-DD)
 */
export function formatGscDate(date: Date): string {
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
