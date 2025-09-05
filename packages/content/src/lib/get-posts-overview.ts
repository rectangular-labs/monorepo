import type { PageTree } from "fumadocs-core/server";
import { blogSource } from "../source";
import type { AuthorSchema } from "./schema";

export type ExtractedPost = {
  url: string;
  title: string | null;
  description: string | null;
  cover: string | null;
  tags: string[];
  createdAt: Date | null;
  lastModified: Date | null;
  authorDetail: Partial<typeof AuthorSchema.infer> | null;
};

function extractPostsFromTree(tree: PageTree.Folder) {
  const items: {
    url: string;
    title: string | null;
    description: string | null;
  }[] = [];

  function walk(folder: PageTree.Folder) {
    for (const child of folder.children) {
      if (child.type === "page") {
        items.push({
          url: child.url,
          title: typeof child.name === "string" ? child.name : null,
          description:
            typeof child.description === "string" ? child.description : null,
        });
      } else if (child.type === "folder") {
        walk(child);
      }
    }
  }

  walk(tree);
  return items;
}

export function getPostsOverview(): ExtractedPost[] {
  const { pageTree } = blogSource;

  const extractedPosts = extractPostsFromTree(pageTree as PageTree.Folder);

  const items: ExtractedPost[] = [];
  for (const post of extractedPosts) {
    const p = blogSource.getPage(post.url.split("/").slice(2));
    items.push({
      url: post.url,
      title: post.title,
      description: post.description,
      cover: p?.data.cover ?? null,
      tags: p?.data.tags ?? [],
      createdAt: p?.data.createdAt ? new Date(p?.data.createdAt) : null,
      lastModified: p?.data.lastModified
        ? new Date(p?.data.lastModified)
        : null,
      authorDetail: p?.data.authorDetail ?? null,
    });
  }

  return items;
}
