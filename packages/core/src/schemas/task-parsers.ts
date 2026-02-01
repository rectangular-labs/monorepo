import { type } from "arktype";
import { articleTypeSchema } from "./content-parsers";
import { businessBackgroundSchema } from "./project-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  projectId: "string.uuid",
  websiteUrl: "string",
});

export const seoUnderstandSiteTaskInputSchema = type({
  type: "'seo-understand-site'",
  projectId: "string.uuid",
});

export const seoStrategySuggestionsTaskInputSchema = type({
  type: "'seo-generate-strategy-suggestions'",
  projectId: "string.uuid",
  instructions: "string",
});

export const seoPlanKeywordTaskInputSchema = type({
  type: "'seo-plan-keyword'",
  projectId: "string.uuid",
  organizationId: "string",
  chatId: "string|null",
  draftId: "string.uuid",
  "callbackInstanceId?": "string",
  "userId?": "string",
});

export const seoWriteArticleTaskInputSchema = type({
  type: "'seo-write-article'",
  projectId: "string",
  organizationId: "string",
  chatId: "string|null",
  draftId: "string.uuid",
  "userId?": "string",
});

export const taskInputSchema = type.or(
  understandSiteTaskInputSchema,
  seoPlanKeywordTaskInputSchema,
  seoWriteArticleTaskInputSchema,
  seoUnderstandSiteTaskInputSchema,
  seoStrategySuggestionsTaskInputSchema,
);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: businessBackgroundSchema.merge(type({ name: "string" })),
});

export const seoPlanKeywordTaskOutputSchema = type({
  type: "'seo-plan-keyword'",
  draftId: "string.uuid",
  outline: "string",
});

export const seoWriteArticleTaskOutputSchema = type({
  type: "'seo-write-article'",
  draftId: "string.uuid",
  content: "string",
  articleType: articleTypeSchema,
  heroImage: "string",
  heroImageCaption: "string|null",
});

export const seoUnderstandSiteTaskOutputSchema = type({
  type: "'seo-understand-site'",
  name: type("string"),
  businessBackground: businessBackgroundSchema.omit("version"),
  brandVoice: type("string"),
});

export const seoStrategySuggestionsTaskOutputSchema = type({
  type: "'seo-generate-strategy-suggestions'",
  projectId: "string",
  strategyIds: type("string.uuid").array(),
});

export const taskOutputSchema = type.or(
  understandSiteTaskOutputSchema,
  seoPlanKeywordTaskOutputSchema,
  seoWriteArticleTaskOutputSchema,
  seoUnderstandSiteTaskOutputSchema,
  seoStrategySuggestionsTaskOutputSchema,
);
