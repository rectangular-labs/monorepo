import { type } from "arktype";

export const contentTypeSchema = type(
  "'blog'|'listicle'|'guide'|'comparison'|'how-to'|'checklist'|'case-study'|'other'",
).describe("The type of content that we want to generate");

export const contentScheduleStatusSchema = type(
  "'draft'|'scheduled'|'published'",
);
