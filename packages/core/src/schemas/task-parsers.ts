import { type } from "arktype";
import { articleTypeSchema } from "./content-parsers";
import { businessBackgroundSchema } from "./project-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  projectId: "string",
  websiteUrl: "string",
});

export const seoPlanKeywordTaskInputSchema = type({
  type: "'seo-plan-keyword'",
  projectId: "string",
  organizationId: "string",
  chatId: "string|null",
  path: "string",
  "callbackInstanceId?": "string",
  "userId?": "string",
});

export const seoWriteArticleTaskInputSchema = type({
  type: "'seo-write-article'",
  projectId: "string",
  organizationId: "string",
  chatId: "string|null",
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
});

export const seoWriteArticleTaskOutputSchema = type({
  type: "'seo-write-article'",
  path: "string",
  content: "string",
  articleType: articleTypeSchema,
});

export const taskOutputSchema = type.or(
  understandSiteTaskOutputSchema,
  seoPlanKeywordTaskOutputSchema,
  seoWriteArticleTaskOutputSchema,
);
