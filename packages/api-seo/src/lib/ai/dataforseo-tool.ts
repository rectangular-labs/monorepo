import {
  fetchKeywordSuggestions,
  fetchKeywordsOverview,
  fetchRankedKeywordsForSite,
  fetchRankedPagesForSite,
  fetchSerp,
} from "@rectangular-labs/dataforseo";
import type { schema } from "@rectangular-labs/db";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import {
  configureDataForSeoClient,
  getLocationAndLanguage,
} from "../dataforseo/utils";

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

export function createDataforseoTool(
  project: typeof schema.seoProject.$inferSelect,
) {
  configureDataForSeoClient();
  const { locationName, languageCode } = getLocationAndLanguage(project);

  const getRankedKeywordsForSite = tool({
    description: "Fetch keywords that the site currently ranks for.",
    inputSchema: jsonSchema<typeof rankedKeywordsInputSchema.infer>(
      rankedKeywordsInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
      const result = await fetchRankedKeywordsForSite({
        hostname,
        locationName,
        languageCode,
        positionFrom,
        positionTo,
        limit,
        offset,
        includeGenderAndAgeDistribution,
      });
      if (!result?.ok) {
        console.error("DFS ranked_keywords error", result.error);
        throw new Error(
          `DFS ranked_keywords error: ${JSON.stringify(result.error, null, 2)}`,
          {
            cause: result.error,
          },
        );
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
    inputSchema: jsonSchema<typeof rankedPagesInputSchema.infer>(
      rankedPagesInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
      const result = await fetchRankedPagesForSite({
        target: hostname,
        locationName,
        languageCode,
        limit,
        offset,
        includeGenderAndAgeDistribution,
      });
      if (!result?.ok) {
        console.error("DFS ranked_pages error", result.error);
        throw new Error(
          `DFS ranked_pages error: ${JSON.stringify(result.error, null, 2)}`,
          {
            cause: result.error,
          },
        );
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
    inputSchema: jsonSchema<typeof keywordSuggestionsInputSchema.infer>(
      keywordSuggestionsInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
      const result = await fetchKeywordSuggestions({
        locationName,
        languageCode,
        seedKeyword,
        includeSeedKeyword,
        includeGenderAndAgeDistribution,
        limit,
        offset,
      });
      if (!result.ok) {
        throw new Error(
          `DFS keyword_suggestions error: ${JSON.stringify(result.error, null, 2)}`,
          {
            cause: result.error,
          },
        );
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
    inputSchema: jsonSchema<typeof keywordsOverviewInputSchema.infer>(
      keywordsOverviewInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ keywords, includeGenderAndAgeDistribution }) {
      console.log("fetchKeywordsOverview", {
        keywords,
        includeGenderAndAgeDistribution,
      });
      const result = await fetchKeywordsOverview({
        keywords,
        locationName,
        languageCode,
        includeGenderAndAgeDistribution,
      });
      if (!result.ok) {
        throw new Error(
          `DFS keywords_overview error: ${JSON.stringify(result.error, null, 2)}`,
          {
            cause: result.error,
          },
        );
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
    inputSchema: jsonSchema<typeof serpInputSchema.infer>(
      serpInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ keyword, depth, device, os }) {
      console.log("fetchSerp", { keyword, depth, device, os });
      const result = await fetchSerp({
        keyword,
        locationName,
        languageCode,
        depth,
        device,
        os,
      });
      if (!result.ok) {
        throw new Error(
          `DFS serp error: ${JSON.stringify(result.error, null, 2)}`,
          {
            cause: result.error,
          },
        );
      }
      return {
        searchTerm: result.value.searchTerm,
        searchResult: result.value.searchResult,
      };
    },
  });

  return {
    get_ranked_keywords_for_site: getRankedKeywordsForSite,
    get_ranked_pages_for_site: getRankedPagesForSite,
    get_keyword_suggestions: getKeywordSuggestions,
    get_keywords_overview: getKeywordOverview,
    get_serp_for_keyword: getSerpForKeyword,
  } as const;
}
