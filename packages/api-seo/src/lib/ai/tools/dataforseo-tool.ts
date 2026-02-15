import type { schema } from "@rectangular-labs/db";
import { tool } from "ai";
import { type } from "arktype";
import type { InitialContext } from "../../../types";
import {
  configureDataForSeoClient,
  fetchKeywordSuggestionsWithCache,
  fetchKeywordsOverviewWithCache,
  fetchRankedKeywordsForSiteWithCache,
  fetchRankedPagesForSiteWithCache,
  fetchSerpWithCache,
  getLocationAndLanguage,
} from "../../dataforseo/utils";
import type { AgentToolDefinition } from "./utils";

const KEYWORD_RESEARCH_DATA_SOURCE = "keyword research data source";

function keywordDataSourceError(operation: string) {
  return `Failed to fetch ${operation} from the ${KEYWORD_RESEARCH_DATA_SOURCE}.`;
}

const hostnameSchema = type("string").describe(
  "The domain name of the target website. The domain should be specified without 'https://' and 'www.'. Example: 'example.xyz', 'fluidposts.ai', 'google.com'",
);

const limitSchema = (noun: string, defaultLimit: number) =>
  type("number")
    .describe(
      `The maximum number of ${noun} to fetch. The default of ${defaultLimit} means that up to ${defaultLimit} ${noun} will be fetched.`,
    )
    .default(defaultLimit);
const offsetSchema = (noun: string, defaultOffset: number) =>
  type("number")
    .describe(
      `The number of ${noun} to skip. The default of ${defaultOffset} means that ${defaultOffset} ${noun} will be skipped before the first ${noun} is fetched.`,
    )
    .default(defaultOffset);
const genderAndAgeDistributionSchema = type("boolean")
  .describe(
    "Whether to include gender and age distribution data in the keyword data. By default gender and age distribution data will not be included.",
  )
  .default(false);

// 1) Ranked Keywords for site
const rankedKeywordsInputSchema = type({
  hostname: hostnameSchema,
  positionFrom: type("number")
    .describe(
      "The highest position ranking keywords that the site currently ranks for. The default of 1 means that any search keyword that has the site ranking at position 1 or lower will be fetched.",
    )
    .default(1),
  positionTo: type("number")
    .describe(
      "The lowest position ranking keywords that the site currently ranks for. The default of 100 means that any search keyword that has the site ranking at position 100 or higher will be fetched.",
    )
    .default(100),
  includeGenderAndAgeDistribution: genderAndAgeDistributionSchema,
  limit: limitSchema("keywords", 100),
  offset: offsetSchema("keywords", 0),
});

// 2) Ranked Pages for site
const rankedPagesInputSchema = type({
  hostname: hostnameSchema,
  includeGenderAndAgeDistribution: genderAndAgeDistributionSchema,
  limit: limitSchema("pages", 100),
  offset: offsetSchema("pages", 0),
});

// 3) Keyword Suggestions
const keywordSuggestionsInputSchema = type({
  seedKeyword: type("string").describe(
    "The seed keyword to fetch suggestions for.",
  ),
  includeSeedKeyword: type("boolean")
    .describe(
      "Whether to include the seed keyword's data. By default the seed keyword's data is included.",
    )
    .default(true),
  includeGenderAndAgeDistribution: genderAndAgeDistributionSchema,
  limit: limitSchema("suggestions", 100),
  offset: offsetSchema("suggestions", 0),
});

// 4) Keywords Overview
const keywordsOverviewInputSchema = type({
  keywords: "string[]",
  includeGenderAndAgeDistribution: genderAndAgeDistributionSchema,
});

// 5) SERP (Advanced)
const serpInputSchema = type({
  keyword: "string",
  depth: type("number")
    .describe(
      "The number of results in the SERP to fetch. The default of 10 means that the top 10 results will be fetched.",
    )
    .default(10),
  device: type("'desktop'|'mobile'")
    .describe(
      "The device to fetch the SERP for. The default uses the 'desktop' device.",
    )
    .default("desktop"),
  os: type("'windows'|'macos'|'android'|'ios'")
    .describe(
      "The operating system to fetch the SERP for. The default uses the 'macos' operating system.",
    )
    .default("macos"),
});

export function createDataforseoToolWithMetadata(
  project: typeof schema.seoProject.$inferSelect,
  cacheKV: InitialContext["cacheKV"],
) {
  configureDataForSeoClient();
  const { locationName, languageCode } = getLocationAndLanguage(project);

  const getRankedKeywordsForSite = tool({
    description: "Fetch keywords that the site currently ranks for.",
    inputSchema: rankedKeywordsInputSchema,
    async execute({
      hostname,
      positionFrom,
      positionTo,
      limit,
      offset,
      includeGenderAndAgeDistribution,
    }) {
      console.log("fetchRankedKeywordsForSite", {
        hostname,
        positionFrom,
        positionTo,
        limit,
        offset,
        includeGenderAndAgeDistribution,
      });
      const result = await fetchRankedKeywordsForSiteWithCache({
        hostname,
        locationName,
        languageCode,
        positionFrom,
        positionTo,
        limit,
        offset,
        includeGenderAndAgeDistribution,
        cacheKV,
      });
      if (!result?.ok) {
        console.error(
          "Keyword data source ranked_keywords error",
          result.error,
        );
        throw new Error(keywordDataSourceError("ranked keywords"), {
          cause: result.error,
        });
      }
      return {
        siteTraffic: result.value.siteTraffic,
        keywords: result.value.keywords.map((keyword) => ({
          keyword: keyword.keyword,
          keywordDifficulty: keyword.keywordDifficulty,
          mainIntent: keyword.mainIntent,
          searchVolume: {
            monthlyAverage: keyword.searchVolume.monthlyAverage,
            percentageChange: keyword.searchVolume.percentageChange,
            ...(includeGenderAndAgeDistribution
              ? {
                  approximateGenderDistributionPercentage:
                    keyword.searchVolume
                      .approximateGenderDistributionPercentage,
                  approximateAgeDistributionPercentage:
                    keyword.searchVolume.approximateAgeDistributionPercentage,
                }
              : {}),
          },
          competition: keyword.competition,
          serpInfo: {
            itemTypes: keyword.serpInfo?.itemTypes,
            resultCount: keyword.serpInfo?.resultCount,
          },
          backlinkInfo: keyword.backlinkInfo,
        })),
      };
    },
  });

  // Ranked Pages tool
  const getRankedPagesForSite = tool({
    description: "Fetch pages of the site that are currently ranked.",
    inputSchema: rankedPagesInputSchema,
    async execute({
      hostname,
      limit,
      offset,
      includeGenderAndAgeDistribution,
    }) {
      console.log("fetchRankedPagesForSite", {
        hostname,
        limit,
        offset,
        includeGenderAndAgeDistribution,
      });
      const result = await fetchRankedPagesForSiteWithCache({
        hostname,
        locationName,
        languageCode,
        limit,
        offset,
        includeGenderAndAgeDistribution,
        cacheKV,
      });
      if (!result?.ok) {
        console.error("Keyword data source ranked_pages error", result.error);
        throw new Error(keywordDataSourceError("ranked pages"), {
          cause: result.error,
        });
      }
      return {
        targetSite: result.value.targetSite,
        rankedPages: result.value.rankedPages,
      };
    },
  });

  // Keyword Suggestions tool
  const getKeywordSuggestions = tool({
    description: "Generate keyword suggestions based of a seed keyword.",
    inputSchema: keywordSuggestionsInputSchema,
    async execute({
      seedKeyword,
      limit,
      offset,
      includeSeedKeyword,
      includeGenderAndAgeDistribution,
    }) {
      console.log("fetchKeywordSuggestions", {
        seedKeyword,
        limit,
        offset,
        includeSeedKeyword,
        includeGenderAndAgeDistribution,
      });
      const result = await fetchKeywordSuggestionsWithCache({
        locationName,
        languageCode,
        seedKeyword,
        includeSeedKeyword,
        includeGenderAndAgeDistribution,
        limit,
        offset,
        cacheKV,
      });
      if (!result.ok) {
        throw new Error(keywordDataSourceError("keyword suggestions"), {
          cause: result.error,
        });
      }
      return {
        keywords: result.value.keywords.map((keyword) => ({
          keyword: keyword.keyword,
          keywordDifficulty: keyword.keywordDifficulty,
          mainIntent: keyword.mainIntent,
          searchVolume: {
            monthlyAverage: keyword.searchVolume.monthlyAverage,
            percentageChange: keyword.searchVolume.percentageChange,
            ...(includeGenderAndAgeDistribution
              ? {
                  approximateGenderDistributionPercentage:
                    keyword.searchVolume
                      .approximateGenderDistributionPercentage,
                  approximateAgeDistributionPercentage:
                    keyword.searchVolume.approximateAgeDistributionPercentage,
                }
              : {}),
          },
          competition: keyword.competition,
          serpInfo: {
            itemTypes: keyword.serpInfo?.itemTypes,
            resultCount: keyword.serpInfo?.resultCount,
          },
          backlinkInfo: keyword.backlinkInfo,
        })),
      };
    },
  });

  // Keywords Overview tool
  const getKeywordOverview = tool({
    description: "Fetch data for a list of keywords.",
    inputSchema: keywordsOverviewInputSchema,
    async execute({ keywords, includeGenderAndAgeDistribution }) {
      console.log("fetchKeywordsOverview", {
        keywords,
        includeGenderAndAgeDistribution,
      });
      const result = await fetchKeywordsOverviewWithCache({
        keywords,
        locationName,
        languageCode,
        includeGenderAndAgeDistribution,
        cacheKV,
      });
      if (!result.ok) {
        throw new Error(keywordDataSourceError("keyword overview"), {
          cause: result.error,
        });
      }
      return {
        keywords: result.value.keywords.map((keyword) => ({
          keyword: keyword.keyword,
          keywordDifficulty: keyword.keywordDifficulty,
          mainIntent: keyword.mainIntent,
          searchVolume: {
            monthlyAverage: keyword.searchVolume.monthlyAverage,
            percentageChange: keyword.searchVolume.percentageChange,
            ...(includeGenderAndAgeDistribution
              ? {
                  approximateGenderDistributionPercentage:
                    keyword.searchVolume
                      .approximateGenderDistributionPercentage,
                  approximateAgeDistributionPercentage:
                    keyword.searchVolume.approximateAgeDistributionPercentage,
                }
              : {}),
          },
          competition: keyword.competition,
          serpInfo: {
            itemTypes: keyword.serpInfo?.itemTypes,
            resultCount: keyword.serpInfo?.resultCount,
          },
          backlinkInfo: keyword.backlinkInfo,
        })),
      };
    },
  });

  // SERP (Advanced) tool
  const getSerpForKeyword = tool({
    description: "Fetch search engine results page (SERP) for a keyword.",
    inputSchema: serpInputSchema,
    async execute({ keyword, depth, device, os }) {
      console.log("fetchSerp", { keyword, depth, device, os });
      const result = await fetchSerpWithCache({
        keyword,
        locationName,
        languageCode,
        depth,
        device,
        os,
        cacheKV,
      });
      if (!result.ok) {
        throw new Error(keywordDataSourceError("SERP data"), {
          cause: result.error,
        });
      }
      return {
        searchTerm: result.value.searchTerm,
        searchResult: result.value.searchResult,
      };
    },
  });

  const tools = {
    get_ranked_keywords_for_site: getRankedKeywordsForSite,
    get_ranked_pages_for_site: getRankedPagesForSite,
    get_keyword_suggestions: getKeywordSuggestions,
    get_keywords_overview: getKeywordOverview,
    get_serp_for_keyword: getSerpForKeyword,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "get_ranked_keywords_for_site",
      toolDescription: "Fetch keywords a site currently ranks for.",
      toolInstruction:
        "Provide hostname without protocol. Use for profiling your site or competitors, and to discover ranking keyword clusters. Tune positionFrom/positionTo and limit/offset.",
      tool: getRankedKeywordsForSite,
    },
    {
      toolName: "get_ranked_pages_for_site",
      toolDescription: "Fetch ranked pages for a site.",
      toolInstruction:
        "Provide hostname without protocol. Use to find top pages and infer content strategy and templates.",
      tool: getRankedPagesForSite,
    },
    {
      toolName: "get_keyword_suggestions",
      toolDescription: "Generate keyword suggestions from a seed keyword.",
      toolInstruction:
        "Provide seedKeyword. Use to expand a topic cluster; then follow with get_keywords_overview for prioritization.",
      tool: getKeywordSuggestions,
    },
    {
      toolName: "get_keywords_overview",
      toolDescription: "Fetch overview metrics for a list of keywords.",
      toolInstruction:
        "Provide keywords[]. Use to compare search volume, difficulty, and intent across a short shortlist.",
      tool: getKeywordOverview,
    },
    {
      toolName: "get_serp_for_keyword",
      toolDescription: "Inspect live SERP results for a keyword.",
      toolInstruction:
        "Provide keyword and optional device/os/depth. Use to understand intent, SERP features, and top-ranking page patterns.",
      tool: getSerpForKeyword,
    },
  ];

  return { toolDefinitions, tools };
}
