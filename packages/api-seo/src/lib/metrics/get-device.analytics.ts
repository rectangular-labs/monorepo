import type { getSearchAnalyticsArgsSchema } from "@rectangular-labs/db/parsers";
import { getSearchAnalytics } from "@rectangular-labs/google-apis/google-search-console";
import { ok } from "@rectangular-labs/result";

export async function getGSCDeviceAnalytics({
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
    dimensions: ["device"],
    aggregationType: "auto",
  });
  if (!result.ok) {
    return result;
  }
  return ok({
    source: "gsc" as const,
    device: result.value.rows?.map((row) => ({
      type: row.keys[0] ?? "",
      clicks: row.clicks,
      impressions: row.impressions,
      ctr: row.ctr,
    })),
  });
}
