import type {
  contentKeywordSchema,
  searchItemSchema,
  serpPositionSchema,
  serpResultSchema,
  serpTrafficSchema,
} from "@rectangular-labs/db/parsers";
import { err, ok, type Result } from "@rectangular-labs/result";
import { getNextEarliestUpdate } from "./lib/get-next-earliest-update";
import { parseKeywordData } from "./lib/parse-keyword-data";
import { parseSerpAdvancedToItems } from "./lib/parse-serp-advanced";
import { parseSiteMetrics } from "./lib/parse-site-metrics";
import {
  googleKeywordOverviewLive,
  googleKeywordSuggestionsLive,
  googleOrganicLiveAdvanced,
  googleRankedKeywordsLive,
  googleRelevantPagesLive,
} from "./sdk.gen";

export async function fetchRankedKeywordsForSite(args: {
  hostname: string;
  locationName: string;
  languageCode: string;
  includeGenderAndAgeDistribution?: boolean;
  positionFrom?: number;
  positionTo?: number;
  limit?: number;
  offset?: number;
}): Promise<
  Result<
    {
      cost: number;
      provider: "dataforseo";
      seProvider: "google" | (string & {});
      nextEarliestUpdate: string;
      siteTraffic: typeof serpTrafficSchema.infer | null;
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
          ...(args.positionFrom
            ? [
                [
                  "ranked_serp_element.serp_item.rank_absolute",
                  ">=",
                  args.positionFrom.toString(),
                ],
                "and",
              ]
            : []),
          ...(args.positionTo
            ? [
                [
                  "ranked_serp_element.serp_item.rank_absolute",
                  "<=",
                  args.positionTo.toString(),
                ],
                "and",
              ]
            : []),
          ["keyword_data.keyword_info.search_volume", ">=", "100"],
        ],
        order_by: ["keyword_data.keyword_info.search_volume,desc"],
        offset: args.offset ?? 0,
        limit: args.limit ?? 1000,
        include_clickstream_data: args.includeGenderAndAgeDistribution ?? false,
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
  const task = json.data.tasks?.[0];
  if (task?.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${task?.status_code} - ${task?.status_message}`,
      ),
    );
  }

  const result = task?.result?.[0];
  if (!result) {
    return err(
      new Error(
        `No result returned from DataForSEO for ranked keywords for site ${args.hostname}`,
      ),
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
  const parsedMetrics = parseSiteMetrics(args.hostname, result.metrics);

  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    siteTraffic: parsedMetrics ?? null,
    keywords,
  });
}

export async function fetchRankedPagesForSite(args: {
  target: string;
  locationName: string;
  languageCode: string;
  limit?: number;
  offset?: number;
  includeGenderAndAgeDistribution?: boolean;
}): Promise<
  Result<
    {
      cost: number;
      provider: "dataforseo";
      seProvider: "google" | (string & {});
      nextEarliestUpdate: string;
      targetSite: string;
      rankedPages: (typeof serpTrafficSchema.infer)[];
    },
    unknown
  >
> {
  const json = await googleRelevantPagesLive({
    body: [
      {
        target: args.target,
        location_name: args.locationName,
        language_code: args.languageCode,
        item_types: ["organic", "paid", "featured_snippet", "local_pack"],
        include_clickstream_data: args.includeGenderAndAgeDistribution ?? false,
        limit: args.limit ?? 100,
        offset: args.offset ?? 0,
        filters: [["metrics.organic.count", ">", "100"]],
        order_by: ["metrics.organic.count,desc"],
      },
    ],
  });

  if (json.error) {
    console.error("fetchRankedPagesForSite error", json.error);
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
  const task = json.data.tasks?.[0];
  if (task?.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${task?.status_code} - ${task?.status_message}`,
      ),
    );
  }

  const result = task?.result?.[0];
  if (!result) {
    return err(
      new Error(
        `No result returned from DataForSEO for ranked pages for site ${args.target}`,
      ),
    );
  }

  const rankedPages = (result.items ?? [])
    .map((item) => {
      if (!item?.page_address) {
        console.warn(
          `No parsed metrics or page address found for relevant page item ${JSON.stringify(item)}`,
        );
        return null;
      }
      const parsedMetrics = parseSiteMetrics(item.page_address, item?.metrics);
      return parsedMetrics;
    })
    .filter((item) => !!item);

  const nextEarliestUpdate = await getNextEarliestUpdate();
  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    targetSite: result.target ?? args.target,
    rankedPages,
  });
}

export async function fetchKeywordSuggestions(args: {
  seedKeyword: string;
  locationName: string;
  languageCode: string;
  includeSeedKeyword?: boolean;
  includeGenderAndAgeDistribution?: boolean;
  limit?: number;
  offset?: number;
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
        limit: args.limit ?? 100,
        offset: args.offset ?? 0,
        include_seed_keyword: args.includeSeedKeyword ?? false,
        include_clickstream_data: args.includeGenderAndAgeDistribution ?? false,
        include_serp_info: true,
        filters: [["keyword_info.search_volume", ">=", "100"]],
        order_by: ["keyword_info.search_volume,desc"],
      },
    ],
  });

  if (json.error) {
    console.error("fetchKeywordSuggestions error", json.error);
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
  const task = json.data.tasks?.[0];
  if (task?.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${task?.status_code} - ${task?.status_message}`,
      ),
    );
  }

  const result = task?.result?.[0];
  if (!result) {
    return err(
      new Error(
        `No result returned from DataForSEO for keyword suggestions for seed keyword ${args.seedKeyword}`,
      ),
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

  const nextEarliestUpdate = await getNextEarliestUpdate();
  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    keywords: keywordSuggestions,
  });
}

export async function fetchKeywordsOverview(args: {
  keywords: string[];
  locationName: string;
  languageCode: string;
  includeGenderAndAgeDistribution?: boolean;
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
  const json = await googleKeywordOverviewLive({
    body: [
      {
        keywords: args.keywords,
        location_name: args.locationName,
        language_code: args.languageCode,
        include_serp_info: true,
        include_clickstream_data: args.includeGenderAndAgeDistribution ?? false,
      },
    ],
  });

  if (json.error) {
    console.error("fetchKeywordsOverview error", json.error);
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
  const task = json.data.tasks?.[0];
  if (task?.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${task?.status_code} - ${task?.status_message}`,
      ),
    );
  }

  const result = task?.result?.[0];
  if (!result) {
    return err(
      new Error(
        `No result returned from DataForSEO for keyword data for keywords ${args.keywords.join(", ")}`,
      ),
    );
  }

  const keywordsOverview = result.items
    ?.map((item) => {
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

  const nextEarliestUpdate = await getNextEarliestUpdate();
  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_type ?? "google",
    nextEarliestUpdate: nextEarliestUpdate.toISOString(),
    keywords: keywordsOverview ?? [],
  });
}

export async function fetchSerp(args: {
  keyword: string;
  locationName: string;
  languageCode: string;
  depth?: number;
  device?: "desktop" | "mobile";
  os?: "windows" | "macos" | "android" | "ios";
}): Promise<
  Result<
    {
      cost: number;
      provider: "dataforseo";
      seProvider: "google" | (string & {});
      searchTerm: string;
      searchUrl: string | null;
      searchResult: (typeof searchItemSchema.infer)[];
    },
    unknown
  >
> {
  const json = await googleOrganicLiveAdvanced({
    body: [
      {
        keyword: args.keyword,
        location_name: args.locationName,
        language_code: args.languageCode,
        depth: args.depth ?? 10,
        device: args.device ?? "desktop",
        os:
          args.os ??
          ((args.device ?? "desktop") === "desktop" ? "macos" : "ios"),
        group_organic_results: true,
        load_async_ai_overview: false,
      },
    ],
  });

  if (json.error) {
    console.error("fetchSerp error", json.error);
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
  const task = json.data.tasks?.[0];
  if (task?.status_code !== 20000) {
    return err(
      new Error(
        `DataForSEO returned an error: ${task?.status_code} - ${task?.status_message}`,
      ),
    );
  }

  const result = task?.result?.[0];
  if (!result) {
    return err(
      new Error(
        `No result returned from DataForSEO for serp advanced for keyword ${args.keyword}`,
      ),
    );
  }

  const normalized = parseSerpAdvancedToItems(result);
  return ok({
    cost: json.data.cost ?? 0,
    provider: "dataforseo",
    seProvider: result.se_domain?.split(".")[0] ?? "google",
    searchTerm: args.keyword,
    searchUrl: result.check_url ?? null,
    searchResult: normalized,
  });
}
