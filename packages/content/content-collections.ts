import {
  type Context,
  defineCollection,
  defineConfig,
  type Meta,
} from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { remarkNpm } from "fumadocs-core/mdx-plugins";
import { createGenerator, remarkAutoTypeTable } from "fumadocs-typescript";
import rehypeExternalLinks from "rehype-external-links";
import { getAuthor } from "./src/lib/markdown/get-author";
import { getContentReadingTime } from "./src/lib/markdown/get-reading-time";
import { getTimestamps } from "./src/lib/markdown/get-timestamps";
import {
  AuthorSchema,
  DocSchema,
  MetaSchema,
  PostSchema,
} from "./src/lib/schema";

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
  const timestamps = getTimestamps({ filepath: document._meta.filePath });
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
  // biome-ignore lint/suspicious/noExplicitAny: We need to access the author dynamically
  const author = getAuthor((mdx as any).author);

  return {
    ...mdx,
    readingTime: readingTime.text,
    ...timestamps,
    authorDetail:
      author ??
      ("author" in mdx && typeof mdx.author === "string"
        ? { name: mdx.author as string }
        : null),
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
  schema: PostSchema,
  transform: (document, context) => mdxTransformer(document, context),
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

const authors = defineCollection({
  name: "authors",
  directory: "authors",
  include: "*.json",
  parser: "json",
  schema: AuthorSchema,
});

export default defineConfig({
  collections: [docs, metas, posts, postMetas, authors],
});
