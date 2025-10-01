import { type } from "arktype";
import { seoWebsiteInfoSchema } from "./project-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  websiteUrl: "string",
});
export const analyzeKeywordsTaskInputSchema = type({
  type: "'analyze-keywords'",
  projectId: "string.uuid",
});

export const taskInputSchema = type.or(
  understandSiteTaskInputSchema,
  analyzeKeywordsTaskInputSchema,
);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: seoWebsiteInfoSchema.merge(type({ name: "string" })),
});
export const analyzeKeywordsTaskOutputSchema = type({
  type: "'analyze-keywords'",
  improvementCampaignIds: "string.uuid[]",
  newContentCampaignIds: "string.uuid[]",
});
export const taskOutputSchema = type.or(
  understandSiteTaskOutputSchema,
  analyzeKeywordsTaskOutputSchema,
);
