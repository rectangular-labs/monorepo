import type {
  backlinkInfoSchema,
  contentKeywordSchema,
  intentSchema,
  keywordCompetitionSchema,
  keywordSearchVolumeSchema,
  keywordSerpInfoSchema,
  seoSerpTrafficSchema,
  serpPositionSchema,
  serpResultSchema,
} from "@rectangular-labs/db/parsers";
import { err, ok, type Result } from "@rectangular-labs/result";
import {
  dataforseoLabsStatus,
  googleKeywordSuggestionsLive,
  googleOrganicLiveAdvanced,
  googleOrganicLiveRegular,
  googleRankedKeywordsLive,
  googleRelevantPagesLive,
} from "./sdk.gen";
import type { KeywordDataInfo } from "./types.gen";

async function getNextEarliestUpdate() {
  const status = await dataforseoLabsStatus();
  const SEVEN_DAYS_IN_MILLISECONDS = 7 * 24 * 60 * 60 * 1000;

  const result = status.data?.tasks?.[0]?.result?.[0]?.google?.date_update;
  const updatedDate = new Date(result ?? Date.now());
  const nextUpdate = updatedDate.getTime() + SEVEN_DAYS_IN_MILLISECONDS;

  if (nextUpdate < Date.now()) {
    // if the next update is in the past, return 7 days from now
    return new Date(Date.now() + SEVEN_DAYS_IN_MILLISECONDS);
  }

  return new Date(nextUpdate);
}

function parseKeywordData(keywordData: KeywordDataInfo): {
  keyword: string;
  keywordDifficulty: number | null;
  mainIntent: typeof intentSchema.infer | null;
  searchVolume: typeof keywordSearchVolumeSchema.infer;
  competition: typeof keywordCompetitionSchema.infer;
  serpInfo: typeof keywordSerpInfoSchema.infer | null;
  backlinkInfo: typeof backlinkInfoSchema.infer | null;
} | null {
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
        | typeof intentSchema.infer
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
      approximateGenderDistribution: item.clickstream_keyword_info
        ?.gender_distribution
        ? {
            male:
              ((item.clickstream_keyword_info?.gender_distribution?.male ?? 0) /
                totalGenderDistribution) *
              100,
            female:
              ((item.clickstream_keyword_info?.gender_distribution?.female ??
                0) /
                totalGenderDistribution) *
              100,
          }
        : null,
      approximateAgeDistribution: item.clickstream_keyword_info
        ?.age_distribution
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
        (item.keyword_info
          ?.competition_level as (typeof keywordCompetitionSchema.infer)["competitionLevel"]) ??
        null,
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

export async function fetchRankedKeywordsForSite(args: {
  hostname: string;
  positionFrom: number;
  positionTo: number;
  locationName: string;
  languageCode: string;
  limit?: number;
  offset?: number;
}): Promise<
  Result<
    {
      cost: number;
      provider: "dataforseo";
      seProvider: "google" | (string & {});
      nextEarliestUpdate: string;
      siteDetails: {
        hostname: string;
        organic: typeof seoSerpTrafficSchema.infer;
      };
      keywords: (typeof contentKeywordSchema.infer & {
        serpDetails:
          | (typeof serpPositionSchema.infer & typeof serpResultSchema.infer)
          | null;
      })[];
    },
    unknown
  >
> {
  const json = await googleRankedKeywordsLive({
    body: [
      {
        target: args.hostname,
        location_name: args.locationName,
        language_code: args.languageCode,
        filters: [
          [
            "ranked_serp_element.serp_item.rank_absolute",
            ">=",
            args.positionFrom.toString(),
          ],
          "and",
          [
            "ranked_serp_element.serp_item.rank_absolute",
            "<=",
            args.positionTo.toString(),
          ],
          "and",
          ["keyword_data.keyword_info.search_volume", ">=", "100"],
        ],
        order_by: ["keyword_data.clickstream_keyword_info.search_volume,desc"],
        offset: args.offset ?? 0,
        limit: args.limit ?? 1000,
        include_clickstream_data: true,
      },
    ],
  });

  if (json.error) {
    return err(json.error);
  }
  if (!json.data) {
    return err(new Error("No data returned from DataForSEO"));
  }
  if (json.data.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${json.data.status_code} - ${json.data.status_message}`,
      ),
    );
  }

  const result = json.data.tasks?.[0]?.result?.[0];
  if (!result) {
    return err(
      new Error("No result returned from DataForSEO for ranked keywords"),
    );
  }
  if ((result.items_count ?? 0) < (result.total_count ?? 0)) {
    console.warn(
      `There are more items than what was allowed when fetching ranked keywords for ${args.hostname} for position ${args.positionFrom}-${args.positionTo} with limit ${args.limit}`,
    );
  }

  const nextEarliestUpdate = await getNextEarliestUpdate();
  const keywords =
    result.items
      ?.map((item) => {
        const keywordData = item?.keyword_data;
        const rankedSerpElement = item?.ranked_serp_element;
        if (!keywordData || !rankedSerpElement) {
          console.warn(
            `No keyword data or ranked serp element for ranked keyword item ${JSON.stringify(item)}`,
          );
          return null;
        }
        const parsedKeywordData = parseKeywordData(keywordData);
        if (!parsedKeywordData) {
          console.warn(
            `No parsed keyword data found for ranked keyword item ${JSON.stringify(item)}`,
          );
          return null;
        }
        return {
          ...parsedKeywordData,
          serpDetails:
            rankedSerpElement.serp_item &&
            (rankedSerpElement.serp_item.rank_group ||
              rankedSerpElement.serp_item.rank_absolute)
              ? {
                  // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                  url: (rankedSerpElement.serp_item as any)?.url ?? null,
                  title:
                    // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                    (rankedSerpElement.serp_item as any)?.title ?? null,
                  description:
                    // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                    (rankedSerpElement.serp_item as any)?.description ?? null,
                  estimatedTrafficVolume:
                    // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                    (rankedSerpElement.serp_item as any)?.etv ?? null,
                  position:
                    rankedSerpElement.serp_item.rank_group ??
                    rankedSerpElement.serp_item.rank_absolute ??
                    -1,
                }
              : null,
        };
      })
      .filter((item) => !!item) ?? [];

  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    siteDetails: {
      hostname: args.hostname,
      organic: {
        position1_10:
          (result.metrics?.organic?.pos_1 ?? 0) +
          (result.metrics?.organic?.pos_2_3 ?? 0) +
          (result.metrics?.organic?.pos_4_10 ?? 0),
        position11_20: result.metrics?.organic?.pos_11_20 ?? 0,
        position21_30: result.metrics?.organic?.pos_21_30 ?? 0,
        estimatedTrafficVolume: result.metrics?.organic?.etv ?? 0,
      },
    },
    keywords,
  });
}

export async function fetchRelevantPages(args: {
  target: string;
  locationName: string;
  languageCode: string;
  limit?: number;
  offset?: number;
}) {
  const json = await googleRelevantPagesLive({
    body: [
      {
        target: args.target,
        location_name: args.locationName,
        language_code: args.languageCode,
        limit: args.limit ?? 100,
        offset: args.offset ?? 0,
      },
    ],
  });

  if (json.error) {
    return err(json.error);
  }
  if (!json.data) {
    return err(new Error("No data returned from DataForSEO"));
  }
  if (json.data.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${json.data.status_code} - ${json.data.status_message}`,
      ),
    );
  }

  const nextEarliestUpdate = await getNextEarliestUpdate();
  const result = json.data.tasks?.[0]?.result?.[0];
  if (!result) {
    return err(new Error("No result returned from DataForSEO"));
  }

  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    targetSite: result.target,
    pages:
      result.items?.map((item) => ({
        url: item?.page_address ?? null,
        metrics: item?.metrics ?? null,
      })) ?? [],
  });
}

export async function fetchSerpResults(args: {
  keyword: string;
  locationName: string;
  languageCode: string;
  depth: number;
}) {
  const json = await googleOrganicLiveRegular({
    body: [
      {
        keyword: args.keyword,
        location_name: args.locationName,
        language_code: args.languageCode,
        depth: args.depth,
      },
    ],
  });

  return json;
}

export async function fetchSerpAdvanced(args: {
  keyword: string;
  locationName: string;
  languageCode: string;
  depth: number;
  device?: "desktop" | "mobile";
}) {
  const json = await googleOrganicLiveAdvanced({
    body: [
      {
        keyword: args.keyword,
        location_name: args.locationName,
        language_code: args.languageCode,
        depth: args.depth,
        ...(args.device ? { device: args.device } : {}),
      },
    ],
  });

  return json;
}

export async function fetchKeywordSuggestions(args: {
  seedKeyword: string;
  locationName: string;
  languageCode: string;
  limit: number;
}): Promise<
  Result<
    {
      cost: number;
      provider: "dataforseo";
      seProvider: "google" | (string & {});
      nextEarliestUpdate: string;
      keywords: (typeof contentKeywordSchema.infer)[];
    },
    unknown
  >
> {
  const json = await googleKeywordSuggestionsLive({
    body: [
      {
        keyword: args.seedKeyword,
        location_name: args.locationName,
        language_code: args.languageCode,
        limit: args.limit,
        include_seed_keyword: true,
        include_clickstream_data: true,
        include_serp_info: true,
        filters: [["keyword_info.search_volume", ">=", "100"]],
        order_by: ["keyword_info.search_volume,desc"],
      },
    ],
  });

  if (json.error) {
    return err(json.error);
  }
  if (!json.data) {
    return err(new Error("No data returned from DataForSEO"));
  }
  if (json.data.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${json.data.status_code} - ${json.data.status_message}`,
      ),
    );
  }

  const nextEarliestUpdate = await getNextEarliestUpdate();
  const result = json.data.tasks?.[0]?.result?.[0];
  if (!result) {
    return err(
      new Error("No result returned from DataForSEO for keyword suggestions"),
    );
  }

  const keywordSuggestions = (
    result.seed_keyword_data
      ? [result.seed_keyword_data, ...(result.items ?? [])]
      : (result.items ?? [])
  )
    .map((item) => {
      if (!item) {
        return null;
      }
      console.log(
        `Keyword ${item.keyword} last updated at ${item.keyword_info?.last_updated_time}`,
      );
      const keywordData = parseKeywordData(item);
      if (!keywordData) {
        console.warn(
          `No keyword data found for keyword ${JSON.stringify(item)}`,
        );
      }
      return keywordData;
    })
    .filter((item) => !!item);

  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    keywords: keywordSuggestions,
  });
}
