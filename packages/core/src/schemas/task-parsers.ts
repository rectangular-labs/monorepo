import { type } from "arktype";
import { businessBackgroundSchema } from "./project-parsers";
import { articleTypeSchema } from "./content-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  projectId: "string",
  websiteUrl: "string",
});

export const seoPlanKeywordTaskInputSchema = type({
  type: "'seo-plan-keyword'",
  projectId: "string",
  organizationId: "string",
  campaignId: "string|null",
  path: "string",
  "callbackInstanceId?": "string",
  "userId?": "string",
});

export const seoWriteArticleTaskInputSchema = type({
  type: "'seo-write-article'",
  projectId: "string",
  organizationId: "string",
  campaignId: "string|null",
  path: "string",
  "userId?": "string",
});

export const taskInputSchema = type.or(
  understandSiteTaskInputSchema,
  seoPlanKeywordTaskInputSchema,
  seoWriteArticleTaskInputSchema,
);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: businessBackgroundSchema.merge(type({ name: "string" })),
});

export const seoPlanKeywordTaskOutputSchema = type({
  type: "'seo-plan-keyword'",
  path: "string",
  outline: "string",
  articleType: articleTypeSchema,
});

export const seoWriteArticleTaskOutputSchema = type({
  type: "'seo-write-article'",
  path: "string",
  content: "string",
});

export const taskOutputSchema = type.or(
  understandSiteTaskOutputSchema,
  seoPlanKeywordTaskOutputSchema,
  seoWriteArticleTaskOutputSchema,
);
