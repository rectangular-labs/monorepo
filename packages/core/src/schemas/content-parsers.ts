import { type } from "arktype";

export const articleTypeSchema = type(
  "'blog'|'listicle'|'guide'|'comparison'|'how-to'|'checklist'|'case-study'|'faq'|'news'|'best-of-list'|'long-form-opinion'|'whitepaper'|'infographic'|'press-release'|'interview'|'product-update'|'contest-giveaway'|'research-summary'|'event-recap'|'best-practices'|'other'",
).describe("The type of article/content that we want to generate");

// Backwards-compatible alias (prefer articleTypeSchema).
export const contentTypeSchema = articleTypeSchema;

export const contentScheduleStatusSchema = type(
  "'draft'|'scheduled'|'published'",
);
