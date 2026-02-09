import { Buffer } from "node:buffer";
import {
  type businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/core/schemas/project-parsers";
import {
  fetchKeywordSuggestions,
  fetchKeywordsOverview,
  fetchRankedKeywordsForSite,
  fetchRankedPagesForSite,
  fetchSerp,
} from "@rectangular-labs/dataforseo";
import { client } from "@rectangular-labs/dataforseo/client";
import { ok, type Result, safe } from "@rectangular-labs/result";
import { apiEnv } from "../../env";
import type { InitialContext } from "../../types";

const DATAFORSEO_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7;

/**
 * FNV-1a hash function.
 * Reference: https://mojoauth.com/hashing/fnv-1a-in-nodejs#advantages-and-disadvantages-of-fnv-1a
 */
function fnv1a(input: string, seed = 2166136261) {
  const bytes = Buffer.from(input);
  let hash = seed;
  for (const byte of bytes) {
    hash ^= byte;
    hash *= 16777619;
  }
  return hash >>> 0;
}

function createDataforseoCacheKey(
  operation: string,
  params: Record<string, unknown>,
) {
  const hash = fnv1a(JSON.stringify(params)).toString(16);
  return `dataforseo-${operation}-${hash}`;
}

export function getLocationAndLanguage(project: {
  businessBackground?: typeof businessBackgroundSchema.infer | null;
}) {
  const locationName =
    COUNTRY_CODE_MAP[project.businessBackground?.targetCountryCode ?? "US"] ||
    "United States";
  const languageCode = project.businessBackground?.languageCode || "en";
  return { locationName, languageCode };
}

export function getHostnameFromUrl(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    return hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "");
  }
}

export function configureDataForSeoClient() {
  client.setConfig({
    auth: () =>
      `${apiEnv().DATAFORSEO_USERNAME}:${apiEnv().DATAFORSEO_PASSWORD}`,
  });
}

export function getSerpCacheOptions(
  primaryKeyword: string,
  locationName: string,
  languageCode: string,
  options?: {
    depth?: number;
    device?: "desktop" | "mobile";
    os?: "windows" | "macos" | "android" | "ios";
  },
) {
  return {
    key: createDataforseoCacheKey("serp", {
      keyword: primaryKeyword,
      locationName,
      languageCode,
      depth: options?.depth ?? 10,
      device: options?.device ?? "desktop",
      os: options?.os ?? "macos",
    }),
    options: {
      ttlSeconds: DATAFORSEO_CACHE_TTL_SECONDS,
    },
  };
}

export function fetchSerpWithCache({
  keyword,
  locationName,
  languageCode,
  cacheKV,
  depth,
  device,
  os,
}: {
  keyword: string;
  locationName: string;
  languageCode: string;
  cacheKV: InitialContext["cacheKV"];
  depth?: number;
  device?: "desktop" | "mobile";
  os?: "windows" | "macos" | "android" | "ios";
}) {
  return fetchWithCache({
    ...getSerpCacheOptions(keyword, locationName, languageCode, {
      depth,
      device,
      os,
    }),
    fn: async () => {
      const result = await fetchSerp({
        keyword,
        locationName,
        languageCode,
        depth,
        device,
        os,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    cacheKV,
  });
}

export function fetchRankedKeywordsForSiteWithCache({
  hostname,
  locationName,
  languageCode,
  positionFrom,
  positionTo,
  limit,
  offset,
  includeGenderAndAgeDistribution,
  cacheKV,
}: {
  hostname: string;
  locationName: string;
  languageCode: string;
  positionFrom: number;
  positionTo: number;
  limit: number;
  offset: number;
  includeGenderAndAgeDistribution: boolean;
  cacheKV: InitialContext["cacheKV"];
}) {
  return fetchWithCache({
    key: createDataforseoCacheKey("ranked-keywords-for-site", {
      hostname,
      locationName,
      languageCode,
      positionFrom,
      positionTo,
      limit,
      offset,
      includeGenderAndAgeDistribution,
    }),
    options: {
      ttlSeconds: DATAFORSEO_CACHE_TTL_SECONDS,
    },
    fn: async () => {
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
      if (!result.ok) throw result.error;
      return result.value;
    },
    cacheKV,
  });
}

export function fetchRankedPagesForSiteWithCache({
  hostname,
  locationName,
  languageCode,
  limit,
  offset,
  includeGenderAndAgeDistribution,
  cacheKV,
}: {
  hostname: string;
  locationName: string;
  languageCode: string;
  limit: number;
  offset: number;
  includeGenderAndAgeDistribution: boolean;
  cacheKV: InitialContext["cacheKV"];
}) {
  return fetchWithCache({
    key: createDataforseoCacheKey("ranked-pages-for-site", {
      hostname,
      locationName,
      languageCode,
      limit,
      offset,
      includeGenderAndAgeDistribution,
    }),
    options: {
      ttlSeconds: DATAFORSEO_CACHE_TTL_SECONDS,
    },
    fn: async () => {
      const result = await fetchRankedPagesForSite({
        target: hostname,
        locationName,
        languageCode,
        limit,
        offset,
        includeGenderAndAgeDistribution,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    cacheKV,
  });
}

export function fetchKeywordSuggestionsWithCache({
  seedKeyword,
  includeSeedKeyword,
  includeGenderAndAgeDistribution,
  locationName,
  languageCode,
  limit,
  offset,
  cacheKV,
}: {
  seedKeyword: string;
  includeSeedKeyword: boolean;
  includeGenderAndAgeDistribution: boolean;
  locationName: string;
  languageCode: string;
  limit: number;
  offset: number;
  cacheKV: InitialContext["cacheKV"];
}) {
  return fetchWithCache({
    key: createDataforseoCacheKey("keyword-suggestions", {
      seedKeyword,
      includeSeedKeyword,
      includeGenderAndAgeDistribution,
      locationName,
      languageCode,
      limit,
      offset,
    }),
    options: {
      ttlSeconds: DATAFORSEO_CACHE_TTL_SECONDS,
    },
    fn: async () => {
      const result = await fetchKeywordSuggestions({
        locationName,
        languageCode,
        seedKeyword,
        includeSeedKeyword,
        includeGenderAndAgeDistribution,
        limit,
        offset,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    cacheKV,
  });
}

export function fetchKeywordsOverviewWithCache({
  keywords,
  includeGenderAndAgeDistribution,
  locationName,
  languageCode,
  cacheKV,
}: {
  keywords: string[];
  includeGenderAndAgeDistribution: boolean;
  locationName: string;
  languageCode: string;
  cacheKV: InitialContext["cacheKV"];
}) {
  return fetchWithCache({
    key: createDataforseoCacheKey("keywords-overview", {
      keywords,
      includeGenderAndAgeDistribution,
      locationName,
      languageCode,
    }),
    options: {
      ttlSeconds: DATAFORSEO_CACHE_TTL_SECONDS,
    },
    fn: async () => {
      const result = await fetchKeywordsOverview({
        keywords,
        locationName,
        languageCode,
        includeGenderAndAgeDistribution,
      });
      if (!result.ok) throw result.error;
      return result.value;
    },
    cacheKV,
  });
}

async function fetchWithCache<T>({
  key,
  fn,
  cacheKV,
  options,
}: {
  key: string;
  fn: () => Promise<T>;
  cacheKV: InitialContext["cacheKV"];
  options?: {
    ttlSeconds?: number;
  };
}): Promise<Result<T, Error>> {
  const cachedResults = await safe(() => {
    return cacheKV.get<T>(key, "json");
  });
  if (cachedResults.ok && !!cachedResults.value) {
    return ok(cachedResults.value);
  }

  const result = await safe(fn);
  if (!result.ok) return result;
  const putResult = await safe(() => {
    return cacheKV.put(key, JSON.stringify(result.value), {
      expirationTtl: options?.ttlSeconds ?? 60 * 60, // default to 1 hour
    });
  });
  if (!putResult.ok) return putResult;

  return ok(result.value);
}
