import { type ArkErrors as ArkErrorsType, type } from "arktype";

export type ArkErrors = ArkErrorsType;

export const cookieSchema = type({
  name: "string",
  value: "string",
});
export type Cookie = typeof cookieSchema.infer;

export const SiteCrawlInputSchema = type({
  startUrl: "string",
  maxRequestsPerCrawl: "number",
  "selector?": "string",
  "waitForSelectorTimeoutMs?": "number",
  "match?": "string[]",
  "exclude?": "string[]",
  "cookie?": [cookieSchema, "[]"],
  "resourceFileTypeExclusions?": "string[]",
});
export type SiteCrawlInput = typeof SiteCrawlInputSchema.infer;
