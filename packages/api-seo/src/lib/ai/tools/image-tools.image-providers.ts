/** biome-ignore-all lint/suspicious/noExplicitAny: to handle random types from API responses */
import type { imageSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import { apiEnv } from "../../../env";

export type StockImageCandidate = {
  provider: (typeof imageSettingsSchema.infer)["stockImageProviders"][number];
  imageUrl: string;
  sourceUrl: string;
  photographerName: string;
  photographerUrl: string;
  attribution: string;
};

function buildAttribution(args: {
  photographerName: string;
  photographerUrl: string;
  source: string;
  sourceUrl: string;
}): string {
  return `Photo by [${args.photographerName}](${args.photographerUrl}) on [${args.source}](${args.sourceUrl})`;
}

export async function searchUnsplash(args: {
  query: string;
  orientation: "landscape" | "portrait" | "square";
}): Promise<StockImageCandidate[]> {
  const apiKey = apiEnv().UNSPLASH_API_KEY;
  const orientation =
    args.orientation === "square" ? "squarish" : args.orientation;
  const url = new URL("/search/photos", "https://api.unsplash.com");
  url.searchParams.set("query", args.query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("orientation", orientation);

  const response = await fetch(url, {
    headers: {
      Authorization: `Client-ID ${apiKey}`,
    },
  });

  if (!response.ok) return [];
  const json = (await response.json().catch(() => null)) as any;
  const results = Array.isArray(json?.results) ? json.results : [];

  return results
    .map((item: any): StockImageCandidate | null => {
      const imageUrl = item?.urls?.regular;
      const sourceUrl = item?.links?.html;
      const photographerName = item?.user?.name;
      const photographerUrl = item?.user?.links?.html;
      if (
        typeof imageUrl !== "string" ||
        typeof sourceUrl !== "string" ||
        typeof photographerName !== "string" ||
        typeof photographerUrl !== "string"
      ) {
        return null;
      }
      return {
        provider: "unsplash",
        imageUrl,
        sourceUrl,
        photographerName,
        photographerUrl,
        attribution: buildAttribution({
          photographerName,
          photographerUrl,
          source: "unsplash",
          sourceUrl,
        }),
      };
    })
    .filter(
      (x: StockImageCandidate | null): x is StockImageCandidate => x !== null,
    );
}

export async function searchPexels(args: {
  query: string;
  orientation: "landscape" | "portrait" | "square";
}): Promise<StockImageCandidate[]> {
  const apiKey = apiEnv().PEXELS_API_KEY;
  const url = new URL("/v1/search", "https://api.pexels.com");
  url.searchParams.set("query", args.query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("orientation", args.orientation);

  const response = await fetch(url, {
    headers: {
      Authorization: apiKey,
    },
  });

  if (!response.ok) return [];
  const json = (await response.json().catch(() => null)) as any;
  const photos = Array.isArray(json?.photos) ? json.photos : [];

  return photos
    .map((item: any): StockImageCandidate | null => {
      const imageUrl = item?.src?.large;
      const sourceUrl = item?.url;
      const photographerName = item?.photographer;
      const photographerUrl = item?.photographer_url;
      if (
        typeof imageUrl !== "string" ||
        typeof sourceUrl !== "string" ||
        typeof photographerName !== "string" ||
        typeof photographerUrl !== "string"
      ) {
        return null;
      }
      return {
        provider: "pexels",
        imageUrl,
        sourceUrl,
        photographerName,
        photographerUrl,
        attribution: buildAttribution({
          photographerName,
          photographerUrl,
          source: "pexels",
          sourceUrl,
        }),
      };
    })
    .filter(
      (x: StockImageCandidate | null): x is StockImageCandidate => x !== null,
    );
}

export async function searchPixabay(args: {
  query: string;
  orientation: "landscape" | "portrait" | "square";
}): Promise<StockImageCandidate[]> {
  const apiKey = apiEnv().PIXABAY_API_KEY;
  const url = new URL("/api/", "https://pixabay.com");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("q", args.query);
  url.searchParams.set("per_page", "5");
  url.searchParams.set("image_type", "photo");
  url.searchParams.set("safesearch", "true");
  if (args.orientation === "portrait")
    url.searchParams.set("orientation", "vertical");
  else url.searchParams.set("orientation", "horizontal");

  const response = await fetch(url);
  if (!response.ok) return [];
  const json = (await response.json().catch(() => null)) as any;
  const hits = Array.isArray(json?.hits) ? json.hits : [];

  return hits
    .map((item: any): StockImageCandidate | null => {
      const imageUrl = item?.webformatURL;
      const sourceUrl = item?.pageURL;
      const photographerName = item?.user;
      const userId = item?.user_id;
      if (
        typeof imageUrl !== "string" ||
        typeof sourceUrl !== "string" ||
        typeof photographerName !== "string"
      ) {
        return null;
      }
      const photographerUrl =
        typeof userId === "number"
          ? `https://pixabay.com/users/${encodeURIComponent(photographerName)}-${userId}/`
          : `https://pixabay.com/users/${encodeURIComponent(photographerName)}/`;
      return {
        provider: "pixabay",
        imageUrl,
        sourceUrl,
        photographerName,
        photographerUrl,
        attribution: buildAttribution({
          photographerName,
          photographerUrl,
          source: "pixabay",
          sourceUrl,
        }),
      };
    })
    .filter(
      (x: StockImageCandidate | null): x is StockImageCandidate => x !== null,
    );
}
