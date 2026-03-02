import type {
  FetchKeywordSuggestionsArgs,
  FetchKeywordsOverviewArgs,
  FetchRankedKeywordsForSiteArgs,
  FetchRankedPagesForSiteArgs,
  FetchSerpArgs,
} from "@rectangular-labs/dataforseo";
import type { schema } from "@rectangular-labs/db";
import { jsonSchema, tool } from "ai";
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

function keywordDataSourceError(operation: string) {
  return `Failed to fetch ${operation} from the keyword research data source.`;
}

const commonListOptionsProperties = {
  includeGenderAndAgeDistribution: {
    type: "boolean",
    description:
      "Whether to include demographic distribution estimates in the response (age and gender).",
  },
  limit: {
    type: "number",
    description: "Maximum number of records to return.",
  },
  offset: {
    type: "number",
    description: "Number of records to skip before returning results.",
  },
} as const;

export function createDataforseoTool(
  project: typeof schema.seoProject.$inferSelect,
  cacheKV: InitialContext["cacheKV"],
) {
  configureDataForSeoClient();
  const { locationName, languageCode } = getLocationAndLanguage(project);

  const getRankedKeywordsForSite = tool({
    description:
      "Fetch keywords that the site currently ranks for. Use for profiling your site or competitors and finding opportunity clusters.",
    inputSchema: jsonSchema<
      Omit<FetchRankedKeywordsForSiteArgs, "locationName" | "languageCode">
    >({
      type: "object",
      additionalProperties: false,
      required: ["hostname"],
      properties: {
        hostname: {
          type: "string",
          description:
            "Domain without protocol or www. Example: example.com, fluidposts.ai",
        },
        positionFrom: {
          type: "number",
        },
        positionTo: {
          type: "number",
        },
        ...commonListOptionsProperties,
      },
    }),
    inputExamples: [
      {
        input: {
          hostname: "zapier.com",
        },
      },
      {
        input: {
          hostname: "notion.so",
          positionFrom: 1,
          positionTo: 20,
          limit: 50,
          offset: 0,
          includeGenderAndAgeDistribution: false,
        },
      },
    ],
    async execute({
      hostname,
      positionFrom = 1,
      positionTo = 100,
      limit = 100,
      offset = 0,
      includeGenderAndAgeDistribution = false,
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
    description:
      "Fetch ranked pages for a site. Use to infer top-performing templates and content patterns.",
    inputSchema: jsonSchema<
      Omit<
        FetchRankedPagesForSiteArgs,
        "target" | "locationName" | "languageCode"
      > & { hostname: string }
    >({
      type: "object",
      additionalProperties: false,
      required: ["hostname"],
      properties: {
        hostname: {
          type: "string",
          description:
            "Domain without protocol or www. Example: example.com, fluidposts.ai",
        },
        ...commonListOptionsProperties,
      },
    }),
    inputExamples: [
      {
        input: {
          hostname: "hubspot.com",
        },
      },
      {
        input: {
          hostname: "ahrefs.com",
          limit: 25,
          offset: 25,
        },
      },
    ],
    async execute({
      hostname,
      limit = 100,
      offset = 0,
      includeGenderAndAgeDistribution = false,
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
    description:
      "Generate keyword suggestions from a seed keyword. Use to expand a topic cluster before prioritization.",
    inputSchema: jsonSchema<
      Omit<FetchKeywordSuggestionsArgs, "locationName" | "languageCode">
    >({
      type: "object",
      additionalProperties: false,
      required: ["seedKeyword"],
      properties: {
        seedKeyword: {
          type: "string",
          description: "Seed keyword to generate suggestions for.",
        },
        includeSeedKeyword: {
          type: "boolean",
        },
        ...commonListOptionsProperties,
      },
    }),
    inputExamples: [
      {
        input: {
          seedKeyword: "invoice automation",
        },
      },
      {
        input: {
          seedKeyword: "local seo audit",
          includeSeedKeyword: false,
          limit: 30,
          offset: 0,
        },
      },
    ],
    async execute({
      seedKeyword,
      limit = 100,
      offset = 0,
      includeSeedKeyword = true,
      includeGenderAndAgeDistribution = false,
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
    description:
      "Fetch overview metrics for a list of keywords. Use to compare volume, difficulty, and intent for shortlist decisions.",
    inputSchema: jsonSchema<
      Omit<FetchKeywordsOverviewArgs, "locationName" | "languageCode">
    >({
      type: "object",
      additionalProperties: false,
      required: ["keywords"],
      properties: {
        keywords: {
          type: "array",
          minItems: 1,
          items: {
            type: "string",
          },
        },
        includeGenderAndAgeDistribution: {
          ...commonListOptionsProperties.includeGenderAndAgeDistribution,
        },
      },
    }),
    inputExamples: [
      {
        input: {
          keywords: ["invoice automation", "accounts payable automation"],
        },
      },
      {
        input: {
          keywords: [
            "best seo tools for agencies",
            "seo platform comparison",
            "enterprise seo software",
          ],
          includeGenderAndAgeDistribution: false,
        },
      },
    ],
    async execute({ keywords, includeGenderAndAgeDistribution = false }) {
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
    description:
      "Inspect live SERP results for a keyword. Use to understand intent, ranking patterns, and SERP features.",
    inputSchema: jsonSchema<
      Omit<FetchSerpArgs, "locationName" | "languageCode" | "targetUrl">
    >({
      type: "object",
      additionalProperties: false,
      required: ["keyword"],
      properties: {
        keyword: {
          type: "string",
        },
        depth: {
          type: "number",
        },
        device: {
          type: "string",
          enum: ["desktop", "mobile"],
        },
        os: {
          type: "string",
          enum: ["windows", "macos", "android", "ios"],
        },
      },
    }),
    inputExamples: [
      {
        input: {
          keyword: "best ai writing tools",
        },
      },
      {
        input: {
          keyword: "seo audit checklist",
          depth: 20,
          device: "mobile",
          os: "android",
        },
      },
    ],
    async execute({ keyword, depth = 10, device = "desktop", os = "macos" }) {
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
  return { tools };
}
