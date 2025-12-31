import { type } from "arktype";

export const projectChatCurrentPageSchema = type(
  "'content-planner'|'content-list'|'stats'|'settings'|'article-editor'",
);
export type ProjectChatCurrentPage = typeof projectChatCurrentPageSchema.infer;
