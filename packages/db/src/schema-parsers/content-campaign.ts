import { type } from "arktype";

export const contentTypeSchema = type(
  "'blog'|'listicle'|'guide'|'comparison'|'how-to'|'checklist'|'case-study'|'other'",
);
export const contentCategorySchema = type(
  "'money-page'|'authority-builder'|'quick-win'",
);
export const campaignTypeSchema = type("'improvement'|'new-content'");
export const statusSchema = type(
  "'analyzing'|'new'|'ready'|'generating-content'|'content-ready'",
);
