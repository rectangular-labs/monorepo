import type { getSearchAnalyticsArgsSchema } from "@rectangular-labs/core/schemas/gsc-property-parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { ok } from "@rectangular-labs/result";

export async function getGSCCountryAnalytics({
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
    dimensions: ["country"],
    aggregationType: "auto",
  });
  if (!result.ok) {
    return result;
  }
  return ok({
    source: "gsc" as const,
    country: result.value.rows?.map((row) => ({
      name: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
    })),
  });
}
