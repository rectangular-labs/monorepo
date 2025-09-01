import { createFromSource } from "fumadocs-core/search/server";
import { source } from "./source.js";

export function createSearchServer() {
  return createFromSource(source, {
    language: "english",
  });
}
