import {
  type businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/core/schemas/project-parsers";
import { client } from "@rectangular-labs/dataforseo/client";
import { ok, type Result, safe } from "@rectangular-labs/result";
import { apiEnv } from "../../env";

export function getLocationAndLanguage(project: {
  businessBackground?: typeof businessBackgroundSchema.infer | null;
}) {
  const locationName =
    COUNTRY_CODE_MAP[project.businessBackground?.targetCountryCode ?? "US"] ??
    "United States";
  const languageCode = project.businessBackground?.languageCode ?? "en";
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

export function getSerpCacheKey(
  primaryKeyword: string,
  locationName: string,
  languageCode: string,
) {
  return `serp-${primaryKeyword}-${locationName}-${languageCode}`;
}

export async function fetchWithCache<T>({
  key,
  fn,
  cacheKV,
  options,
}: {
  key: string;
  fn: () => Promise<T>;
  cacheKV: KVNamespace;
  options?: {
    ttlSeconds?: number;
    waitUntil?: (promise: Promise<void>) => void;
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
