import type {
  contentKeywordSchema,
  keywordIntentSchema,
} from "@rectangular-labs/core/schemas/keyword-parsers";
import type { KeywordDataInfo } from "../types.gen";

export function parseKeywordData(
  keywordData: KeywordDataInfo,
): typeof contentKeywordSchema.infer | null {
  const item = keywordData;
  if (!item.keyword) {
    return null;
  }

  const totalGenderDistribution =
    (item.clickstream_keyword_info?.gender_distribution?.male ?? 0) +
    (item.clickstream_keyword_info?.gender_distribution?.female ?? 0);
  const totalAgeDistribution = Object.values(
    item.clickstream_keyword_info?.age_distribution ?? {},
  ).reduce((acc: number, curr: number | null) => acc + (curr ?? 0), 0);

  return {
    keyword: item.keyword,
    keywordDifficulty: item.keyword_properties?.keyword_difficulty ?? null,
    mainIntent:
      (item.search_intent_info?.main_intent as
        | typeof keywordIntentSchema.infer
        | null
        | undefined) ?? null,
    searchVolume: {
      monthlyAverage: item.keyword_info?.search_volume ?? null,
      monthlyBreakdown:
        item.keyword_info?.monthly_searches?.map((month) => ({
          year: month?.year ?? null,
          month: month?.month ?? null,
          searchVolume: month?.search_volume ?? null,
        })) ?? null,
      percentageChange: item.keyword_info?.search_volume_trend
        ? {
            monthly: item.keyword_info?.search_volume_trend?.monthly ?? null,
            quarterly:
              item.keyword_info?.search_volume_trend?.quarterly ?? null,
            yearly: item.keyword_info?.search_volume_trend?.yearly ?? null,
          }
        : null,
      approximateGenderDistributionPercentage:
        item.clickstream_keyword_info?.gender_distribution &&
        totalGenderDistribution > 0
          ? {
              male:
                ((item.clickstream_keyword_info?.gender_distribution?.male ??
                  0) /
                  totalGenderDistribution) *
                100,
              female:
                ((item.clickstream_keyword_info?.gender_distribution?.female ??
                  0) /
                  totalGenderDistribution) *
                100,
            }
          : null,
      approximateAgeDistributionPercentage:
        item.clickstream_keyword_info?.age_distribution &&
        totalAgeDistribution > 0
          ? Object.fromEntries(
              Object.entries(
                item.clickstream_keyword_info?.age_distribution ?? {},
              ).map(([age, count]) => [
                age,
                ((count ?? 0) / totalAgeDistribution) * 100,
              ]),
            )
          : null,
    },
    competition: {
      cpc: item.keyword_info?.cpc ?? null,
      competition: item.keyword_info?.competition ?? null,
      competitionLevel:
        (item.keyword_info?.competition_level as
          | (typeof contentKeywordSchema.infer)["competition"]["competitionLevel"]
          | null) ?? null,
      lowTopOfPageBid: item.keyword_info?.low_top_of_page_bid ?? null,
      highTopOfPageBid: item.keyword_info?.high_top_of_page_bid ?? null,
    },
    serpInfo: item.serp_info
      ? {
          url: item.serp_info?.check_url ?? null,
          itemTypes: item.serp_info?.serp_item_types
            ? item.serp_info.serp_item_types.filter((item) => item !== null)
            : null,
          resultCount: item.serp_info?.se_results_count ?? null,
        }
      : null,
    backlinkInfo: item.avg_backlinks_info
      ? {
          averageBacklinkCount: item.avg_backlinks_info?.backlinks ?? null,
          averageDoFollowLinkCount: item.avg_backlinks_info?.dofollow ?? null,
          averageReferringPageCount:
            item.avg_backlinks_info?.referring_pages ?? null,
          averageReferringDomainCount:
            item.avg_backlinks_info?.referring_domains ?? null,
          averageReferringMainDomainCount:
            item.avg_backlinks_info?.referring_main_domains ?? null,
          averagePageRank: item.avg_backlinks_info?.rank ?? null,
          averageMainDomainRank:
            item.avg_backlinks_info?.main_domain_rank ?? null,
        }
      : null,
  };
}
