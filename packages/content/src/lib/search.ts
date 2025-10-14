import { createFromSource } from "fumadocs-core/search/server";
import { blogSource, docSource, seoBlogSource } from "../source";

export function createDocsSearchServer() {
  return createFromSource(docSource, { language: "english" });
}

export function createBlogSearchServer() {
  return createFromSource(blogSource, { language: "english" });
}

export function createSeoBlogSearchServer() {
  return createFromSource(seoBlogSource, { language: "english" });
}
