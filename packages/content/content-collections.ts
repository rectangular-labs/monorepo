import {
  type Context,
  defineCollection,
  defineConfig,
  type Meta,
} from "@content-collections/core";
import { transformMDX } from "@fumadocs/content-collections/configuration";
import { remarkNpm } from "fumadocs-core/mdx-plugins";
import rehypeExternalLinks from "rehype-external-links";
import { getContentReadingTime } from "./src/lib/markdown/get-reading-time";
import { getTimestamps } from "./src/lib/markdown/get-timestamps";
import {
  AuthorSchema,
  DocSchema,
  MetaSchema,
  PostSchema,
} from "./src/lib/schema";

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
    remarkPlugins: [[remarkNpm, { persist: { id: "package-manager" } }]],
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
  let authorDetail: typeof AuthorSchema.infer | null = null;
  if ("author" in mdx && typeof mdx.author === "string") {
    const author = context.documents(authors).find((author) => {
      if (author._meta.path === mdx.author) {
        authorDetail = author;
        return true;
      }
      return false;
    });
    if (author) {
      authorDetail = { name: author.name, image: author.image };
    } else {
      authorDetail = { name: mdx.author, image: "" };
    }
  }

  return {
    ...mdx,
    readingTime: readingTime.text,
    ...timestamps,
    authorDetail,
  };
};

const docs = defineCollection({
  name: "docs",
  directory: "../",
  include: "**/docs/**/*.mdx",
  exclude: "**/node_modules/**",
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

const seoPosts = defineCollection({
  name: "seoPosts",
  directory: "../../apps/seo-www/content",
  include: "**/*.mdx",
  schema: PostSchema,
  transform: (document, context) => mdxTransformer(document, context),
});

const metas = defineCollection({
  name: "meta",
  directory: "../",
  include: "**/docs/**/meta.json",
  exclude: "**/node_modles/**",
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

const seoPostMetas = defineCollection({
  name: "seoPostMetas",
  directory: "../../apps/seo-www/content",
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
  collections: [docs, metas, posts, postMetas, authors, seoPosts, seoPostMetas],
});
