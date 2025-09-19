import { type } from "arktype";

export const cookieSchema = type({
  name: "string",
  value: "string",
});
export type Cookie = typeof cookieSchema.infer;

export const SiteCrawlInputSchema = type({
  startUrl: "string",
  maxRequestsPerCrawl: "number",
  crawlSitemap: "boolean=false",
  "selector?": "string",
  "waitForSelectorTimeoutMs?": "number",
  "match?": "string[]",
  "exclude?": "string[]",
  "cookie?": [cookieSchema, "[]"],
  "resourceFileTypeExclusions?": "string[]",
});
export type SiteCrawlInput = typeof SiteCrawlInputSchema.infer & {
  onProgress?: (args: {
    currentUrl?: string;
    inFlight: number;
    succeeded: number;
    failed: number;
  }) => void | Promise<void>;
};

export const SiteCrawlOutputSchema = type({
  title: "string",
  url: "string",
  text: "string",
  "description?": "string",
  "contentHtml?": "string",
  "contentMarkdown?": "string",
  extractor: "string",
});
export type SiteCrawlOutput = typeof SiteCrawlOutputSchema.infer;
