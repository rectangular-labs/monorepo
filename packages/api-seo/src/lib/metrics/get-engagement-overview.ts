import type { fetchRankedKeywordsForSite } from "@rectangular-labs/dataforseo";
import type { getSearchAnalyticsArgsSchema } from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { ok } from "@rectangular-labs/result";

export async function getGSCEngagementOverview({
  accessToken,
  siteUrl,
  siteType,
  startDate,
  endDate,
  previousEndDate,
  days,
}: {
  accessToken: string;
  siteUrl: string;
  siteType: (typeof getSearchAnalyticsArgsSchema.infer)["siteType"];
  startDate: string;
  endDate: string;
  previousEndDate: string;
  days: number;
}) {
  const result = await getSearchAnalytics(accessToken, {
    siteUrl,
    siteType,
    startDate,
    endDate,
    dimensions: ["date"],
    rowLimit: days,
  });

  if (!result.ok) {
    return result;
  }

  const rows = result.value.rows ?? [];
  let isPreviousData = true;
  const clicks = {
    current: 0,
    previous: 0,
    changePercentage: 0,
  };
  const impressions = {
    current: 0,
    previous: 0,
    changePercentage: 0,
  };
  const timeseries: { date: string; clicks: number; impressions: number }[] =
    [];
  for (const row of rows) {
    if (row.keys[0] === previousEndDate) {
      isPreviousData = false;
    }
    if (isPreviousData) {
      clicks.previous += row.clicks;
      impressions.previous += row.impressions;
    } else {
      clicks.current += row.clicks;
      impressions.current += row.impressions;
      timeseries.push({
        date: row.keys[0] ?? "",
        clicks: row.clicks,
        impressions: row.impressions,
      });
    }
  }
  clicks.changePercentage =
    ((clicks.current - clicks.previous) / clicks.previous) * 100;
  impressions.changePercentage =
    ((impressions.current - impressions.previous) / impressions.previous) * 100;
  return ok({
    source: "gsc" as const,
    clicks,
    impressions,
    timeseries,
  });
}

export function getDataForSeoEngagementOverview({
  data,
  lookBackRange,
}: {
  data: Extract<
    Awaited<ReturnType<typeof fetchRankedKeywordsForSite>>,
    { ok: true }
  >["value"];
  lookBackRange: 7 | 28 | 90;
}) {
  const clicks = {
    current: 0,
    previous: undefined as number | undefined,
    changePercentage: undefined as number | undefined,
  };
  const impressions = {
    current: 0,
    previous: undefined as number | undefined,
    changePercentage: undefined as number | undefined,
  };

  if (lookBackRange === 7) {
    for (const keyword of data.keywords) {
      const currentImpression =
        (keyword.searchVolume?.monthlyBreakdown?.at(-1)?.searchVolume ?? 0) / 4; // assume 4 weeks in a month
      const etvMultiplier =
        (keyword.serpDetails?.estimatedTrafficVolume ?? 0) /
        (keyword.searchVolume?.monthlyAverage ?? 1);

      const currentClick = currentImpression * etvMultiplier;

      clicks.current += currentClick;
      impressions.current += currentImpression;
    }
  } else if (lookBackRange === 28) {
    for (const keyword of data.keywords) {
      const currentImpression =
        keyword.searchVolume?.monthlyBreakdown?.at(-1)?.searchVolume ?? 0;
      const etvMultiplier =
        (keyword.serpDetails?.estimatedTrafficVolume ?? 0) /
        (keyword.searchVolume?.monthlyAverage ?? 1);
      const currentClick = currentImpression * etvMultiplier;

      const previousImpression =
        keyword.searchVolume?.monthlyBreakdown?.at(-2)?.searchVolume ?? 0;
      const previousClick = previousImpression * etvMultiplier;

      clicks.current += currentClick;
      impressions.current += currentImpression;
      clicks.previous = (clicks.previous ?? 0) + previousClick;
      impressions.previous = (impressions.previous ?? 0) + previousImpression;
    }

    clicks.changePercentage = clicks.previous
      ? ((clicks.current - clicks.previous) / clicks.previous) * 100
      : undefined;
    impressions.changePercentage = impressions.previous
      ? ((impressions.current - impressions.previous) / impressions.previous) *
        100
      : undefined;
  } else if (lookBackRange === 90) {
    for (const keyword of data.keywords) {
      const currentImpression =
        keyword.searchVolume?.monthlyBreakdown
          ?.slice(-3)
          ?.reduce((sum, month) => sum + (month.searchVolume ?? 0), 0) ?? 0;
      const etvMultiplier =
        (keyword.serpDetails?.estimatedTrafficVolume ?? 0) /
        (keyword.searchVolume?.monthlyAverage ?? 1);
      const currentClick = currentImpression * etvMultiplier;

      const previousImpression =
        keyword.searchVolume?.monthlyBreakdown
          ?.slice(-6, -3)
          ?.reduce((sum, month) => sum + (month.searchVolume ?? 0), 0) ?? 0;
      const previousClick = previousImpression * etvMultiplier;

      clicks.current += currentClick;
      impressions.current += currentImpression;
      clicks.previous = (clicks.previous ?? 0) + previousClick;
      impressions.previous = (impressions.previous ?? 0) + previousImpression;
    }
    clicks.changePercentage = clicks.previous
      ? ((clicks.current - clicks.previous) / clicks.previous) * 100
      : undefined;
    impressions.changePercentage = impressions.previous
      ? ((impressions.current - impressions.previous) / impressions.previous) *
        100
      : undefined;
  }

  return {
    source: "dfs" as const,
    clicks,
    impressions,
  };
}
