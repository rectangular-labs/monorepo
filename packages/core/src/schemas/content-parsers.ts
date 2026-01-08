import { type } from "arktype";

export const contentStatusSchema = type(
  "'suggested'|'queued'|'generating'|'generation-failed'|'pending-review'|'scheduled'|'published'|'suggestion-rejected'|'review-denied'",
).describe("The status of the content");
export const CONTENT_STATUSES = [
  "suggested",
  "queued",
  "generating",
  "generation-failed",
  "pending-review",
  "scheduled",
  "published",
  "suggestion-rejected",
  "review-denied",
] as const satisfies (typeof contentStatusSchema.infer)[];

export const articleTypeSchema = type(
  "'listicle'|'comparison'|'how-to'|'case-study'|'faq'|'news'|'best-of-list'|'long-form-opinion'|'whitepaper'|'infographic'|'press-release'|'interview'|'product-update'|'contest-giveaway'|'research-summary'|'event-recap'|'best-practices'|'other'",
).describe("The type of article/content that we want to generate");

export const ARTICLE_TYPES = [
  "listicle",
  "comparison",
  "how-to",
  "case-study",
  "faq",
  "news",
  "best-of-list",
  "long-form-opinion",
  "whitepaper",
  "infographic",
  "press-release",
  "interview",
  "product-update",
  "contest-giveaway",
  "research-summary",
  "event-recap",
  "best-practices",
  "other",
] as const satisfies (typeof articleTypeSchema.infer)[];
