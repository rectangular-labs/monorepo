import { client } from "@rectangular-labs/dataforseo/client";
import type { schema } from "@rectangular-labs/db";
import { COUNTRY_CODE_MAP } from "@rectangular-labs/db/parsers";
import { apiEnv } from "../../env";

export function getLocationAndLanguage(
  project: typeof schema.seoProject.$inferSelect,
) {
  const locationName =
    COUNTRY_CODE_MAP[project.websiteInfo?.targetCountryCode ?? "US"] ??
    "United States";
  const languageCode = project.websiteInfo?.languageCode ?? "en";
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
