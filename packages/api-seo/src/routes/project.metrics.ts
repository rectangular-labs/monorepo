import { ORPCError } from "@orpc/server";
import { fetchRankedKeywordsForSite } from "@rectangular-labs/dataforseo";
import { getSeoProjectByIdentifierAndOrgId } from "@rectangular-labs/db/operations";
import { getLastNDaysRange } from "@rectangular-labs/google-apis/google-search-console";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import {
  configureDataForSeoClient,
  getHostnameFromUrl,
  getLocationAndLanguage,
} from "../lib/dataforseo/utils";
import { getGSCCountryAnalytics } from "../lib/metrics/get-country.analytics";
import { getGSCDeviceAnalytics } from "../lib/metrics/get-device.analytics";
import {
  getDataForSeoEngagementOverview,
  getGSCEngagementOverview,
} from "../lib/metrics/get-engagement-overview";
import {
  getDataForSeoPageAnalytics,
  getGSCPageAnalytics,
} from "../lib/metrics/get-page.analytics";
import {
  getDataForSeoQueryAnalytics,
  getGSCQueryAnalytics,
} from "../lib/metrics/get-query.analytics";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

const metricsOutputSchema = type({
  source: "'gsc'|'dfs'",
  // From Overview
  "clicks?": type({
    current: "number",
    changePercentage: "number|undefined",
    previous: "number|undefined",
  }),
  "impressions?": type({
    current: "number",
    changePercentage: "number|undefined",
    previous: "number|undefined",
  }),
  "timeseries?": type({
    date: "string",
    clicks: "number",
    impressions: "number",
  }).array(),
  // From Query
  "queries?": type({
    value: "string",
    clicks: "number",
    impressions: "number",
    ctr: "number",
  }).array(),
  // From Page
  "pages?": type({
    url: "string",
    clicks: "number",
    impressions: "number",
    ctr: "number",
  }).array(),
  // From Country
  "country?": type({
    name: "string",
    clicks: "number",
    impressions: "number",
    ctr: "number",
  }).array(),
  // From Device
  "device?": type({
    type: "string",
    clicks: "number",
    impressions: "number",
    ctr: "number",
  }).array(),
});

export const metrics = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}/metrics" })
  .input(
    type({
      identifier: "string.url|string",
      organizationIdentifier: "string",
      dateRange: type("'7d'|'28d'|'90d'").pipe(
        (value) => parseInt((value ?? "28d").slice(0, -1), 10) as 7 | 28 | 90,
      ),
      "dimensions?":
        "('query'|'page'|'country'|'device'|'overview')[]|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(metricsOutputSchema)
  .handler(async ({ context, input }) => {
    const dimensions = input.dimensions ?? (["overview", "query"] as const);

    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.identifier,
      context.organization.id,
      {
        businessBackground: true,
      },
    );

    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    const project = projectResult.value;
    if (!project) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }

    const currentDateRange = getLastNDaysRange(input.dateRange);
    const previousDateRange = getLastNDaysRange(input.dateRange * 2);
    previousDateRange.endDate = currentDateRange.startDate;

    // Configure our data sources
    const gscProperty = await (async () => {
      if (!project.gscPropertyId) {
        return null;
      }
      const gscPropertyResult = await getGSCPropertyById(project.gscPropertyId);
      if (!gscPropertyResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: gscPropertyResult.error.message,
          cause: gscPropertyResult.error,
        });
      }
      return gscPropertyResult.value;
    })();

    const dataForSeoData = await (async () => {
      if (project.gscPropertyId) {
        return null;
      }
      configureDataForSeoClient();
      const { locationName, languageCode } = getLocationAndLanguage(project);
      const dataForSeoDataResult = await fetchRankedKeywordsForSite({
        hostname: getHostnameFromUrl(project.websiteUrl),
        locationName,
        languageCode,
        positionFrom: 1,
        positionTo: 100,
        limit: 500,
        includeGenderAndAgeDistribution: false,
      });
      if (!dataForSeoDataResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: `Failed to fetch DataForSEO ranked keywords: ${JSON.stringify(dataForSeoDataResult.error, null, 2)}`,
          cause: dataForSeoDataResult.error,
        });
      }
      return dataForSeoDataResult.value;
    })();

    // Get the overview data
    let finalResult: typeof metricsOutputSchema.infer = {
      source: gscProperty ? ("gsc" as const) : ("dfs" as const),
    };

    if (dimensions.includes("overview")) {
      if (gscProperty) {
        const gscOverviewResult = await getGSCEngagementOverview({
          accessToken: gscProperty.accessToken,
          siteUrl: gscProperty.domain,
          siteType: gscProperty.type,
          startDate: previousDateRange.startDate,
          endDate: currentDateRange.endDate,
          previousEndDate: previousDateRange.endDate,
          days: input.dateRange * 2, // each date should be a single row. 2x to account for the previous date range
        });
        if (!gscOverviewResult.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: `Failed to fetch GSC engagement overview: ${JSON.stringify(gscOverviewResult.error, null, 2)}`,
            cause: gscOverviewResult.error,
          });
        }
        finalResult = {
          ...gscOverviewResult.value,
        };
      }
      if (dataForSeoData) {
        const dfsOverview = getDataForSeoEngagementOverview({
          data: dataForSeoData,
          lookBackRange: input.dateRange,
        });
        finalResult = {
          ...dfsOverview,
        };
      }
    }

    if (dimensions.includes("page")) {
      if (gscProperty) {
        const pageAnalyticsResult = await getGSCPageAnalytics({
          accessToken: gscProperty.accessToken,
          siteUrl: gscProperty.domain,
          siteType: gscProperty.type,
          startDate: currentDateRange.startDate,
          endDate: currentDateRange.endDate,
        });
        if (!pageAnalyticsResult.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: pageAnalyticsResult.error.message,
            cause: pageAnalyticsResult.error,
          });
        }
        finalResult = {
          ...finalResult,
          ...pageAnalyticsResult.value,
        };
      }
      if (dataForSeoData) {
        const dfsPageAnalytics = getDataForSeoPageAnalytics({
          data: dataForSeoData,
          lookBackRange: input.dateRange,
        });
        finalResult = {
          ...finalResult,
          ...dfsPageAnalytics,
        };
      }
    }
    if (dimensions.includes("query")) {
      if (gscProperty) {
        const queryAnalyticsResult = await getGSCQueryAnalytics({
          accessToken: gscProperty.accessToken,
          siteUrl: gscProperty.domain,
          siteType: gscProperty.type,
          startDate: currentDateRange.startDate,
          endDate: currentDateRange.endDate,
        });
        if (!queryAnalyticsResult.ok) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: queryAnalyticsResult.error.message,
            cause: queryAnalyticsResult.error,
          });
        }
        finalResult = {
          ...finalResult,
          ...queryAnalyticsResult.value,
        };
      }
      if (dataForSeoData) {
        const dfsQueryAnalytics = getDataForSeoQueryAnalytics({
          data: dataForSeoData,
          lookBackRange: input.dateRange,
        });
        finalResult = {
          ...finalResult,
          ...dfsQueryAnalytics,
        };
      }
    }
    // we don't show country analytics for dfs, bc it's expensive
    if (dimensions.includes("country") && gscProperty) {
      const countryAnalyticsResult = await getGSCCountryAnalytics({
        accessToken: gscProperty.accessToken,
        siteUrl: gscProperty.domain,
        siteType: gscProperty.type,
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate,
      });
      if (!countryAnalyticsResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: countryAnalyticsResult.error.message,
          cause: countryAnalyticsResult.error,
        });
      }
      finalResult = {
        ...finalResult,
        ...countryAnalyticsResult.value,
      };
    }

    // we don't show device analytics for dfs, bc it isn't supported.
    if (dimensions.includes("device") && gscProperty) {
      const deviceAnalyticsResult = await getGSCDeviceAnalytics({
        accessToken: gscProperty.accessToken,
        siteUrl: gscProperty.domain,
        siteType: gscProperty.type,
        startDate: currentDateRange.startDate,
        endDate: currentDateRange.endDate,
      });
      if (!deviceAnalyticsResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: deviceAnalyticsResult.error.message,
          cause: deviceAnalyticsResult.error,
        });
      }
      finalResult = {
        ...finalResult,
        ...deviceAnalyticsResult.value,
      };
    }

    return finalResult;
  });
