import {
  auth,
  searchconsole as searchConsole,
  type searchconsole_v1,
} from "@googleapis/searchconsole";
import { err, ok, type Result, safe } from "@rectangular-labs/result";

export interface GscClientConfig {
  credentials: {
    clientId: string;
    clientSecret: string;
    accessToken: string;
    refreshToken?: string | undefined;
    scopes?: string[] | undefined;
    expiryDate?: Date | undefined;
    idToken?: string | undefined;
  };
  onTokenRefresh?: (tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
  }) => Promise<void>;
}

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
 * Create a Google Search Console client
 */
export function createGscClient(
  config: GscClientConfig,
): searchconsole_v1.Searchconsole {
  const oauthClient = new auth.OAuth2({
    clientId: config.credentials.clientId,
    clientSecret: config.credentials.clientSecret,
  });
  oauthClient.setCredentials({
    access_token: config.credentials.accessToken,
    refresh_token: config.credentials.refreshToken ?? null,
    expiry_date: config.credentials.expiryDate?.getTime() ?? null,
    id_token: config.credentials.idToken ?? null,
    ...(config.credentials.scopes
      ? { scope: config.credentials.scopes.join(" ") }
      : {}),
  });

  // Listen for token refresh events
  oauthClient.on("tokens", async (tokens) => {
    if (config.onTokenRefresh && tokens.access_token) {
      const tokenUpdate: {
        accessToken: string;
        refreshToken?: string;
        expiresAt: Date;
      } = {
        accessToken: tokens.access_token,
        expiresAt: new Date(tokens.expiry_date || Date.now() + 3600 * 1000),
      };

      if (tokens.refresh_token) {
        tokenUpdate.refreshToken = tokens.refresh_token;
      }

      await config.onTokenRefresh(tokenUpdate);
    }
  });

  const searchConsoleApi = searchConsole({
    version: "v1",
    auth: oauthClient,
  });

  return searchConsoleApi;
}

/**
 * List all GSC properties the user has access to
 */
export async function listProperties(
  searchConsoleApi: searchconsole_v1.Searchconsole,
): Promise<Result<GscProperty[], Error>> {
  const response = await safe(() => searchConsoleApi.sites.list({}));
  if (!response.ok) {
    return err(response.error);
  }
  if (!response.value.ok) {
    return err(
      new Error(`Failed to list properties: ${await response.value.text()}`),
    );
  }

  const properties: GscProperty[] = (response.value.data.siteEntry || [])
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

/**
 * Get search analytics for a property
 *
 * @param args.siteUrl - The GSC property URL (e.g., "https://example.com/")
 * @param args.startDate - Start date in YYYY-MM-DD format
 * @param args.endDate - End date in YYYY-MM-DD format
 * @param args.dimensions - Dimensions to group by (query, page, country, device, searchAppearance)
 * @param args.filters - Dimension filters to apply
 * @param args.rowLimit - Max rows to return (max 25000)
 * @param args.startRow - Starting row for pagination
 */
export async function getSearchAnalytics(
  searchConsoleApi: searchconsole_v1.Searchconsole,
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
  try {
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

    const response = await searchConsoleApi.searchanalytics.query({
      siteUrl: args.siteUrl,
      requestBody,
    });

    const rows: GscAnalyticsRow[] = (response.data.rows || []).map((row) => ({
      keys: row.keys ?? [],
      clicks: row.clicks ?? 0,
      impressions: row.impressions ?? 0,
      ctr: row.ctr ?? 0,
      position: row.position ?? 0,
    }));

    return ok({
      rows,
      responseAggregationType: (response.data.responseAggregationType ??
        "auto") as "auto" | "byProperty" | "byPage",
    });
  } catch (error) {
    return err(
      error instanceof Error
        ? error
        : new Error("Failed to fetch search analytics"),
    );
  }
}

/**
 * Get keywords a specific page ranks for
 */
export function getKeywordsForPage(
  searchConsoleApi: searchconsole_v1.Searchconsole,
  args: {
    siteUrl: string;
    pageUrl: string;
    startDate: string;
    endDate: string;
    minImpressions?: number;
  },
): Promise<Result<GscAnalyticsResponse, Error>> {
  return getSearchAnalytics(searchConsoleApi, {
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
  searchConsoleApi: searchconsole_v1.Searchconsole,
  args: {
    siteUrl: string;
    startDate: string;
    endDate: string;
    limit?: number;
  },
): Promise<Result<GscAnalyticsResponse, Error>> {
  return getSearchAnalytics(searchConsoleApi, {
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
