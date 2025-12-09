import { client } from "@rectangular-labs/dataforseo/client";
import {
  type businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/db/parsers";
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
