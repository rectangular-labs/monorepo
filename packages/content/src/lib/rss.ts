import { Feed } from "feed";
import { blogSource } from "../../src/source";

export function getBlogRSS(baseUrl: string) {
  const feed = new Feed({
    title: "Blog",
    id: `${baseUrl}/blog`,
    link: `${baseUrl}/blog`,
    language: "en",
    copyright: "All rights reserved 2025, Rectangular Labs",
  });

  for (const page of blogSource.getPages()) {
    feed.addItem({
      id: page.url,
      title: page.data.title,
      description: page.data.description,
      link: `${baseUrl}${page.url}`,
      date: new Date(
        // try to pick up date from frontmatter if present later
        page.data.date ?? Date.now(),
      ),
      author: [{ name: "Winston Yeo" }],
    });
  }

  return feed.rss2();
}
