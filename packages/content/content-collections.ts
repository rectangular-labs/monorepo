// @ts-check
import { defineCollection, defineConfig } from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { type } from "arktype";
import { createGenerator, remarkAutoTypeTable } from "fumadocs-typescript";

const DocSchema = type({
  title: "string",
  "description?": "string",
  "icon?": "string",
  "full?": "boolean",
  // TODO: add openapi thingy
  // "_openapi?": "Record<string, any>",
});

const generator = createGenerator();
const docs = defineCollection({
  name: "docs",
  directory: "../",
  include: "**/docs/**/*.mdx",
  schema: DocSchema,
  transform: (document, context) =>
    transformMDX(document, context, {
      remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    }),
});

const MetaSchema = type({
  "title?": "string",
  "description?": "string",
  "icon?": "string",
  "pages?": "string[]",
  "root?": "boolean",
  "defaultOpen?": "boolean",
});
const metas = defineCollection({
  name: "meta",
  directory: "../",
  include: "**/docs/**/meta.json",
  parser: "json",
  schema: MetaSchema,
});

const posts = defineCollection({
  name: "posts",
  directory: "posts",
  include: "  **/*.mdx",
  schema: type({
    "...": DocSchema,
    // blog-specific
    "cover?": "string",
  }),
  transform: (document, context) =>
    transformMDX(document, context, {
      remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    }),
});

const postMetas = defineCollection({
  name: "postMetas",
  directory: "posts",
  include: "**/meta.json",
  parser: "json",
  schema: MetaSchema,
});

export default defineConfig({
  collections: [docs, metas, posts, postMetas],
});
