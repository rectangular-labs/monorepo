import {
  type Context,
  defineCollection,
  defineConfig,
  type Meta,
} from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { type } from "arktype";
import { remarkNpm } from "fumadocs-core/mdx-plugins";
import { createGenerator, remarkAutoTypeTable } from "fumadocs-typescript";
import rehypeExternalLinks from "rehype-external-links";
import { getLastModified } from "./src/lib/markdown/get-last-modified";
import { getContentReadingTime } from "./src/lib/markdown/get-reading-time";

const DocSchema = type({
  title: "string",
  "description?": "string",
  "icon?": "string",
  "full?": "boolean",
  // TODO: add openapi thingy
  // "_openapi?": "Record<string, any>",
});

const generator = createGenerator();
const mdxTransformer = async <
  D extends {
    _meta: Meta;
    content: string;
  },
  C extends Context<typeof DocSchema.infer>,
>(
  document: D,
  context: C,
) => {
  const readingTime = getContentReadingTime({
    content: document.content,
  });
  const lastModified = getLastModified({ filepath: document._meta.filePath });
  const mdx = await transformMDX(document, context, {
    remarkPlugins: [
      [remarkAutoTypeTable, { generator }],
      [remarkNpm, { persist: { id: "package-manager" } }],
    ],
    rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: "_blank",
          rel: ["noopener", "noreferrer"],
          content: { type: "text", value: " 🔗" },
        },
      ],
    ],
  });
  return {
    ...mdx,
    readingTime: readingTime.text,
    lastModified,
  };
};

const docs = defineCollection({
  name: "docs",
  directory: "../",
  include: "**/docs/**/*.mdx",
  schema: DocSchema,
  transform: async (document, context) => mdxTransformer(document, context),
});
const posts = defineCollection({
  name: "posts",
  directory: "posts",
  include: "**/*.mdx",
  schema: type({
    "...": DocSchema,
    // blog-specific
    "cover?": "string",
  }),
  transform: (document, context) => mdxTransformer(document, context),
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
