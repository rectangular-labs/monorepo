// @ts-check
import { defineCollection, defineConfig } from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { type } from "arktype";
import { createGenerator, remarkAutoTypeTable } from "fumadocs-typescript";

const docSchema = type({
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
  include: "**/*.mdx",
  schema: docSchema,
  transform: (document, context) =>
    transformMDX(document, context, {
      remarkPlugins: [[remarkAutoTypeTable, { generator }]],
    }),
});

const metaSchema = type({
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
  include: "**/meta.json",
  parser: "json",
  schema: metaSchema,
});

export default defineConfig({
  collections: [docs, metas],
});
