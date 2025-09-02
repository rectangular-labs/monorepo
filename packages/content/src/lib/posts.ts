import type { PageTree } from "fumadocs-core/server";

export type ExtractedPost = {
  url: string;
  title: string | null;
  description: string | null;
  cover: string | null;
};

export function extractPostsFromTree(tree: PageTree.Folder): ExtractedPost[] {
  const items: ExtractedPost[] = [];

  function walk(folder: PageTree.Folder) {
    for (const child of folder.children) {
      if (child.type === "page") {
        items.push({
          url: typeof child.url === "string" ? child.url : "#",
          title: typeof child.name === "string" ? child.name : null,
          description:
            typeof child.description === "string" ? child.description : null,
          cover:
            typeof (child as { data?: { cover?: unknown } }).data?.cover ===
            "string"
              ? ((child as { data?: { cover?: unknown } }).data
                  ?.cover as string)
              : null,
        });
      } else if (child.type === "folder") {
        walk(child);
      }
    }
  }

  walk(tree);
  return items;
}
