import { type } from "arktype";

export const contentTypeSchema = type(
  "'blog'|'listicle'|'guide'|'comparison'|'how-to'|'checklist'|'case-study'|'other'",
).describe("The type of content that we want to generate");
export const contentCategorySchema = type(
  "'money-page'|'authority-builder'|'quick-win'",
);
export const campaignTypeSchema = type(
  "'improvement'|'new-content'|'do-nothing'",
);
export const statusSchema = type(
  "'analyzing'|'new'|'ready'|'generating-content'|'content-ready'|'published'",
);
export const intentSchema = type(
  "'transactional'|'informational'|'navigational'|'commercial'",
);
