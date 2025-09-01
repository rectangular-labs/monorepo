import { blogSource } from "@rectangular-labs/content";
import { extractPostsFromTree } from "@rectangular-labs/content/posts";
import { PostCard } from "@rectangular-labs/content/ui/post-card";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@rectangular-labs/ui/components/ui/toggle-group";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import type { PageTree } from "fumadocs-core/server";
import { useMemo, useState } from "react";

const getBlogTree = createServerFn({ method: "GET" }).handler(
  () => blogSource.pageTree as object,
);

export const Route = createFileRoute("/blog/")({
  component: Page,
  loader: async () => {
    const tree = await getBlogTree();
    return { tree };
  },
});

function Page() {
  const { tree } = Route.useLoaderData();
  const parsedTree = tree as PageTree.Folder;

  const [query, setQuery] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");

  const postsAll = useMemo(
    () => extractPostsFromTree(parsedTree),
    [parsedTree],
  );
  const posts = useMemo(() => {
    if (!query) return postsAll;
    const q = query.toLowerCase();
    return postsAll.filter(
      (p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q),
    );
  }, [postsAll, query]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-1">
          <h1 className="font-semibold text-2xl tracking-tight">Blog</h1>
          <p className="text-muted-foreground">
            Thoughts, tutorials, and updates.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup
            onValueChange={(v) => v && setView(v as "grid" | "list")}
            type="single"
            value={view}
          >
            <ToggleGroupItem value="grid">Grid</ToggleGroupItem>
            <ToggleGroupItem value="list">List</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="relative">
        <Input
          className="w-full"
          onChange={(e) =>
            setQuery("value" in e.target ? (e.target.value as string) : "")
          }
          placeholder="Search posts"
          value={query}
        />
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts found.</p>
      ) : view === "list" ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard
              cover={post.cover}
              description={post.description}
              href={post.url}
              key={post.url}
              title={post.title ?? "Untitled"}
              variant="list"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <PostCard
              cover={post.cover}
              description={post.description}
              href={post.url}
              key={post.url}
              title={post.title ?? "Untitled"}
            />
          ))}
        </div>
      )}
    </div>
  );
}
