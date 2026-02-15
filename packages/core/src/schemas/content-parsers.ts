import { type } from "arktype";

/**
 * Draft statuses for the content workflow.
 *
 * - suggested: AI/system proposed this content
 * - suggestion-rejected: User declined the suggestion
 * - queued: Accepted, waiting in backlog
 * - planning: Working on outline
 * - writing: Content being written
 * - reviewing-writing: AI reviewing the content
 * - pending-review: Ready for human review
 * - review-denied: Reviewer requested changes
 * - scheduled: Approved, ready to be published at specified date
 */
export const contentStatusSchema = type(
  "'suggested'|'suggestion-rejected'|'queued'|'planning'|'writing'|'reviewing-writing'|'pending-review'|'review-denied'|'scheduled'|'published'",
).describe("The status of the content draft");

export const CONTENT_STATUSES = [
  "suggested",
  "suggestion-rejected",
  "queued",
  "planning",
  "writing",
  "reviewing-writing",
  "pending-review",
  "review-denied",
  "scheduled",
  "published",
] as const satisfies (typeof contentStatusSchema.infer)[];

export type SeoFileStatus = (typeof CONTENT_STATUSES)[number];

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
export type ArticleType = (typeof ARTICLE_TYPES)[number];
