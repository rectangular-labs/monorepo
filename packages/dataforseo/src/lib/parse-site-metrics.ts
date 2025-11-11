import type { serpTrafficSchema } from "@rectangular-labs/db/parsers";
import type { DataforseoLabsMetricsInfo } from "../types.gen";

export function parseSiteMetrics(
  url: string,
  metrics:
    | {
        [key: string]: DataforseoLabsMetricsInfo;
      }
    | null
    | undefined,
): typeof serpTrafficSchema.infer | null {
  if (!metrics) {
    return null;
  }
  const totalOrganicGenderDistribution =
    (metrics.organic?.clickstream_gender_distribution?.male ?? 0) +
    (metrics.organic?.clickstream_gender_distribution?.female ?? 0);
  const totalOrganicAgeDistribution = Object.values(
    metrics.organic?.clickstream_age_distribution ?? {},
  ).reduce((acc: number, curr: number | null) => acc + (curr ?? 0), 0);
  const totalPaidGenderDistribution =
    (metrics.paid?.clickstream_gender_distribution?.male ?? 0) +
    (metrics.paid?.clickstream_gender_distribution?.female ?? 0);
  const totalPaidAgeDistribution = Object.values(
    metrics.paid?.clickstream_age_distribution ?? {},
  ).reduce((acc: number, curr: number | null) => acc + (curr ?? 0), 0);
  const totalFeaturedSnippetGenderDistribution =
    (metrics.featured_snippet?.clickstream_gender_distribution?.male ?? 0) +
    (metrics.featured_snippet?.clickstream_gender_distribution?.female ?? 0);
  const totalFeaturedSnippetAgeDistribution = Object.values(
    metrics.featured_snippet?.clickstream_age_distribution ?? {},
  ).reduce((acc: number, curr: number | null) => acc + (curr ?? 0), 0);
  const totalLocalPackGenderDistribution =
    (metrics.local_pack?.clickstream_gender_distribution?.male ?? 0) +
    (metrics.local_pack?.clickstream_gender_distribution?.female ?? 0);
  const totalLocalPackAgeDistribution = Object.values(
    metrics.local_pack?.clickstream_age_distribution ?? {},
  ).reduce((acc: number, curr: number | null) => acc + (curr ?? 0), 0);

  return {
    url,
    organic: metrics.organic
      ? {
          position1_10:
            (metrics.organic?.pos_1 ?? 0) +
            (metrics.organic?.pos_2_3 ?? 0) +
            (metrics.organic?.pos_4_10 ?? 0),
          position11_20: metrics.organic?.pos_11_20 ?? 0,
          position21_30: metrics.organic?.pos_21_30 ?? 0,
          position31_40: metrics.organic?.pos_31_40 ?? 0,
          position41_50: metrics.organic?.pos_41_50 ?? 0,
          estimatedTrafficVolume: metrics.organic?.etv ?? 0,
          rankedKeywords: metrics.organic?.count ?? 0,
          approximateAgeDistributionPercentage:
            metrics.organic?.clickstream_age_distribution &&
            totalOrganicAgeDistribution > 0
              ? Object.fromEntries(
                  Object.entries(
                    metrics.organic?.clickstream_age_distribution ?? {},
                  ).map(([age, count]) => [
                    age,
                    ((count ?? 0) / totalOrganicAgeDistribution) * 100,
                  ]),
                )
              : null,
          approximateGenderDistributionPercentage:
            metrics.organic?.clickstream_gender_distribution &&
            totalOrganicGenderDistribution > 0
              ? {
                  male:
                    ((metrics.organic?.clickstream_gender_distribution?.male ??
                      0) /
                      totalOrganicGenderDistribution) *
                    100,
                  female:
                    ((metrics.organic?.clickstream_gender_distribution
                      ?.female ?? 0) /
                      totalOrganicGenderDistribution) *
                    100,
                }
              : null,
        }
      : null,
    paid: metrics.paid
      ? {
          position1_10:
            (metrics.paid?.pos_1 ?? 0) +
            (metrics.paid?.pos_2_3 ?? 0) +
            (metrics.paid?.pos_4_10 ?? 0),
          position11_20: metrics.paid?.pos_11_20 ?? 0,
          position21_30: metrics.paid?.pos_21_30 ?? 0,
          position31_40: metrics.paid?.pos_31_40 ?? 0,
          position41_50: metrics.paid?.pos_41_50 ?? 0,
          rankedKeywords: metrics.paid?.count ?? 0,
          estimatedTrafficVolume: metrics.paid?.etv ?? 0,
          approximateAgeDistributionPercentage:
            metrics.paid?.clickstream_age_distribution &&
            totalPaidAgeDistribution > 0
              ? Object.fromEntries(
                  Object.entries(
                    metrics.paid?.clickstream_age_distribution ?? {},
                  ).map(([age, count]) => [
                    age,
                    ((count ?? 0) / totalPaidAgeDistribution) * 100,
                  ]),
                )
              : null,
          approximateGenderDistributionPercentage:
            metrics.paid?.clickstream_gender_distribution &&
            totalPaidGenderDistribution > 0
              ? {
                  male:
                    ((metrics.paid?.clickstream_gender_distribution?.male ??
                      0) /
                      totalPaidGenderDistribution) *
                    100,
                  female:
                    ((metrics.paid?.clickstream_gender_distribution?.female ??
                      0) /
                      totalPaidGenderDistribution) *
                    100,
                }
              : null,
        }
      : null,
    featured_snippet: metrics.featured_snippet
      ? {
          position1_10:
            (metrics.featured_snippet?.pos_1 ?? 0) +
            (metrics.featured_snippet?.pos_2_3 ?? 0) +
            (metrics.featured_snippet?.pos_4_10 ?? 0),
          position11_20: metrics.featured_snippet?.pos_11_20 ?? 0,
          position21_30: metrics.featured_snippet?.pos_21_30 ?? 0,
          position31_40: metrics.featured_snippet?.pos_31_40 ?? 0,
          position41_50: metrics.featured_snippet?.pos_41_50 ?? 0,
          rankedKeywords: metrics.featured_snippet?.count ?? 0,
          estimatedTrafficVolume: metrics.featured_snippet?.etv ?? 0,
          approximateAgeDistributionPercentage:
            metrics.featured_snippet?.clickstream_age_distribution &&
            totalFeaturedSnippetAgeDistribution > 0
              ? Object.fromEntries(
                  Object.entries(
                    metrics.featured_snippet?.clickstream_age_distribution ??
                      {},
                  ).map(([age, count]) => [
                    age,
                    ((count ?? 0) / totalFeaturedSnippetAgeDistribution) * 100,
                  ]),
                )
              : null,
          approximateGenderDistributionPercentage:
            metrics.featured_snippet?.clickstream_gender_distribution &&
            totalFeaturedSnippetGenderDistribution > 0
              ? {
                  male:
                    ((metrics.featured_snippet?.clickstream_gender_distribution
                      ?.male ?? 0) /
                      totalFeaturedSnippetGenderDistribution) *
                    100,
                  female:
                    ((metrics.featured_snippet?.clickstream_gender_distribution
                      ?.female ?? 0) /
                      totalFeaturedSnippetGenderDistribution) *
                    100,
                }
              : null,
        }
      : null,
    local_pack: metrics.local_pack
      ? {
          position1_10:
            (metrics.local_pack?.pos_1 ?? 0) +
            (metrics.local_pack?.pos_2_3 ?? 0) +
            (metrics.local_pack?.pos_4_10 ?? 0),
          position11_20: metrics.local_pack?.pos_11_20 ?? 0,
          position21_30: metrics.local_pack?.pos_21_30 ?? 0,
          position31_40: metrics.local_pack?.pos_31_40 ?? 0,
          position41_50: metrics.local_pack?.pos_41_50 ?? 0,
          rankedKeywords: metrics.local_pack?.count ?? 0,
          estimatedTrafficVolume: metrics.local_pack?.etv ?? 0,
          approximateAgeDistributionPercentage:
            metrics.local_pack?.clickstream_age_distribution &&
            totalLocalPackAgeDistribution > 0
              ? Object.fromEntries(
                  Object.entries(
                    metrics.local_pack?.clickstream_age_distribution ?? {},
                  ).map(([age, count]) => [
                    age,
                    ((count ?? 0) / totalLocalPackAgeDistribution) * 100,
                  ]),
                )
              : null,
          approximateGenderDistributionPercentage:
            metrics.local_pack?.clickstream_gender_distribution &&
            totalLocalPackGenderDistribution > 0
              ? {
                  male:
                    ((metrics.local_pack?.clickstream_gender_distribution
                      ?.male ?? 0) /
                      totalLocalPackGenderDistribution) *
                    100,
                  female:
                    ((metrics.local_pack?.clickstream_gender_distribution
                      ?.female ?? 0) /
                      totalLocalPackGenderDistribution) *
                    100,
                }
              : null,
        }
      : null,
  };
}
