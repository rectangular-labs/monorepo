import { type } from "arktype";
import { seoWebsiteInfoSchema } from "./seo-website-info-schema";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  websiteUrl: "string",
});
export const generateKeywordClustersTaskInputSchema = type({
  type: "'generate-keyword-clusters'",
  keywordCategory: "string",
});
export const taskInputSchema = understandSiteTaskInputSchema.or(
  generateKeywordClustersTaskInputSchema,
);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: seoWebsiteInfoSchema.merge(type({ name: "string" })),
});
export const generateKeywordClustersTaskOutputSchema = type({
  type: "'generate-keyword-clusters'",
  clusters: type({
    name: type("string"),
    primaryKeyword: type("string"),
    secondaryKeywords: type("string").array(),
  }).array(),
});
export const taskOutputSchema = understandSiteTaskOutputSchema.or(
  generateKeywordClustersTaskOutputSchema,
);
