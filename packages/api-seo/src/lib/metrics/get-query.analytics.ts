import type { fetchRankedKeywordsForSite } from "@rectangular-labs/dataforseo";
import type { getSearchAnalyticsArgsSchema } from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { ok } from "@rectangular-labs/result";

export async function getGSCQueryAnalytics({
  accessToken,
  siteUrl,
  siteType,
  startDate,
  endDate,
}: {
  accessToken: string;
  siteUrl: string;
  siteType: (typeof getSearchAnalyticsArgsSchema.infer)["siteType"];
  startDate: string;
  endDate: string;
}) {
  const result = await getSearchAnalytics(accessToken, {
    siteUrl,
    siteType,
    startDate,
    endDate,
    dimensions: ["query"],
    aggregationType: "auto",
  });
  if (!result.ok) {
    return result;
  }
  return ok({
    source: "gsc" as const,
    queries: result.value.rows?.map((row) => ({
      value: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
    })),
  });
}

export function getDataForSeoQueryAnalytics({
  data,
  lookBackRange,
}: {
  data: Extract<
    Awaited<ReturnType<typeof fetchRankedKeywordsForSite>>,
    { ok: true }
  >["value"];
  lookBackRange: 7 | 28 | 90;
}) {
  const results: {
    value: string;
    clicks: number;
    impressions: number;
    ctr: number;
  }[] = [];

  for (const keyword of data.keywords) {
    let currentImpression = 0;
    if (lookBackRange === 7) {
      currentImpression =
        (keyword.searchVolume?.monthlyBreakdown?.at(-1)?.searchVolume ?? 0) / 4; // assume 4 weeks in a month
    } else if (lookBackRange === 28) {
      currentImpression =
        keyword.searchVolume?.monthlyBreakdown?.at(-1)?.searchVolume ?? 0;
    } else if (lookBackRange === 90) {
      currentImpression =
        keyword.searchVolume?.monthlyBreakdown
          ?.slice(-3)
          ?.reduce((sum, month) => sum + (month.searchVolume ?? 0), 0) ?? 0;
    }

    const etvMultiplier =
      (keyword.serpDetails?.estimatedTrafficVolume ?? 0) /
      (keyword.searchVolume?.monthlyAverage ?? 1);
    const currentClick = currentImpression * etvMultiplier;
    results.push({
      value: keyword.keyword,
      clicks: currentClick,
      impressions: currentImpression,
      ctr: currentImpression > 0 ? currentClick / currentImpression : 0,
    });
  }

  return {
    source: "dfs" as const,
    queries: results,
  };
}
