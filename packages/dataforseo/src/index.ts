import type {
  intentSchema,
  seoSerpTrafficSchema,
} from "@rectangular-labs/db/parsers";
import { err, ok, type Result } from "@rectangular-labs/result";
import {
  dataforseoLabsStatus,
  googleKeywordSuggestionsLive,
  googleOrganicLiveRegular,
  googleRankedKeywordsLive,
} from "./sdk.gen";

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
      se_provider: "google" | (string & {});
      nextEarliestUpdate: string;
      siteDetails: {
        hostname: string;
        organic: typeof seoSerpTrafficSchema.infer;
      };
      keywords: {
        keyword: string;
        keywordDifficulty: number | null;
        cpc: number | null;
        competitionLevel: "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH" | null;
        competition: number | null;
        searchVolume: number | null;
        mainIntent: typeof intentSchema.infer | null;
        backlinkInfo: {
          avgBacklinks: number | null;
          avgDoFollow: number | null;
          avgReferringPages: number | null;
          avgReferringDomains: number | null;
          avgReferringMainDomains: number | null;
          avgRank: number | null;
          avgMainDomainRank: number | null;
        };
        serpFeatures: string[] | null;
        serpDetails: {
          url: string | null;
          title: string | null;
          description: string | null;
          position: number | null;
          estimatedTrafficVolume: number | null;
        };
      }[];
    },
    unknown
  >
> {
  const status = await dataforseoLabsStatus();
  const nextEarliestUpdate = (() => {
    const result = status.data?.tasks?.[0]?.result?.[0]?.google?.date_update;
    const updatedDate = new Date(result ?? Date.now());
    const nextUpdate = updatedDate.getTime() + 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    return new Date(nextUpdate);
  })();

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
        order_by: ["ranked_serp_element.serp_item.rank_absolute,asc"],
        offset: args.offset ?? 0,
        limit: args.limit ?? 1000,
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
    return err(new Error("No result returned from DataForSEO"));
  }
  if ((result.items_count ?? 0) < (result.total_count ?? 0)) {
    console.warn(
      `There are more items than what was allowed when fetching ranked keywords for ${args.hostname} for position ${args.positionFrom}-${args.positionTo} with limit ${args.limit}`,
    );
  }

  return ok({
    cost: json.data.cost ?? 0,
    se_provider: result.se_type ?? "google",
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
    keywords:
      result.items
        ?.map((item) => {
          if (!item) {
            console.warn("No item", item);
            return null;
          }
          const { keyword_data, ranked_serp_element } = item;
          if (!keyword_data || !ranked_serp_element) {
            console.warn("No keyword data or ranked serp element", item);
            return null;
          }
          const { keyword, ...keywordData } = keyword_data;
          if (!keyword) {
            console.warn("No keyword in keyword data found", item);
            return null;
          }
          return {
            keyword: keyword,
            keywordDifficulty:
              keywordData.keyword_properties?.keyword_difficulty ?? null,
            cpc: keywordData.keyword_info?.cpc ?? null,
            competitionLevel:
              (keywordData.keyword_info?.competition_level as
                | "LOW"
                | "MEDIUM"
                | "HIGH"
                | "VERY_HIGH"
                | null) ?? null,
            competition: keywordData.keyword_info?.competition ?? null,
            searchVolume: keywordData.keyword_info?.search_volume ?? null,
            mainIntent:
              (keywordData.search_intent_info?.main_intent as
                | typeof intentSchema.infer
                | null) ?? ("informational" as const),
            serpFeatures:
              keywordData.serp_info?.serp_item_types?.filter(
                (item): item is string => !!item,
              ) ?? [],
            backlinkInfo: {
              avgBacklinks: keywordData.avg_backlinks_info?.backlinks ?? null,
              avgDoFollow: keywordData.avg_backlinks_info?.dofollow ?? null,
              avgReferringPages:
                keywordData.avg_backlinks_info?.referring_pages ?? null,
              avgReferringDomains:
                keywordData.avg_backlinks_info?.referring_domains ?? null,
              avgReferringMainDomains:
                keywordData.avg_backlinks_info?.referring_main_domains ?? null,
              avgRank: keywordData.avg_backlinks_info?.rank ?? null,
              avgMainDomainRank:
                keywordData.avg_backlinks_info?.main_domain_rank ?? null,
            },
            serpDetails: {
              // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
              url: (ranked_serp_element.serp_item as any)?.url ?? null,
              // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
              title: (ranked_serp_element.serp_item as any)?.title ?? null,
              description:
                // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                (ranked_serp_element.serp_item as any)?.description ?? null,
              estimatedTrafficVolume:
                // biome-ignore lint/suspicious/noExplicitAny: dataForSeo api return type missing
                (ranked_serp_element.serp_item as any)?.etv ?? null,
              position: ranked_serp_element.serp_item?.rank_group ?? null,
            },
          };
        })
        .filter((item) => !!item) ?? [],
  });
}

export async function fetchKeywordSuggestions(args: {
  seedKeyword: string;
  locationName: string;
  languageCode: string;
  limit: number;
}) {
  const json = await googleKeywordSuggestionsLive({
    body: [
      {
        keyword: args.seedKeyword,
        location_name: args.locationName,
        language_code: args.languageCode,
        limit: args.limit,
      },
    ],
  });

  return json;
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
