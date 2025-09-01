import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import type { PageTree } from "fumadocs-core/server";
import type { LoaderOutput } from "fumadocs-core/source";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/links";
import {
  DocsBody,
  DocsDescription,
  DocsPage,
  DocsTitle,
} from "fumadocs-ui/page";
import type { MDXComponents } from "mdx/types";
import { useMemo } from "react";
import { baseOptions } from "../lib/layout";
import { extractPostsFromTree } from "../lib/posts";
import { transformPageTree } from "../lib/transform-page-tree";
import type { blogSource } from "../source";
import { MDXRenderer } from "./mdx-renderer";
import { PostCard } from "./post-card";

export function PostPage({
  data,
  tree: dataTree,
  layoutOptions,
  components,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: generic to support any page type
  tree: LoaderOutput<any>["pageTree"] | object;
  data: NonNullable<ReturnType<typeof blogSource.getPage>>["data"];
  layoutOptions?: BaseLayoutProps;
  components?: MDXComponents;
}) {
  const tree = useMemo(
    () => transformPageTree(dataTree as PageTree.Folder),
    [dataTree],
  );
  const posts = useMemo(
    () => extractPostsFromTree(dataTree as PageTree.Folder),
    [dataTree],
  );

  const currentUrl = window.location.href;
  const currentIndex = useMemo(
    () => (currentUrl ? posts.findIndex((p) => p.url === currentUrl) : -1),
    [posts, currentUrl],
  );
  const prevPost = currentIndex > 0 ? posts[currentIndex - 1] : undefined;
  const nextPost =
    currentIndex >= 0 && currentIndex < posts.length - 1
      ? posts[currentIndex + 1]
      : undefined;
  const relatedPosts = useMemo(
    () => posts.filter((p) => p.url !== currentUrl).slice(0, 3),
    [posts, currentUrl],
  );

  const shareHref = currentUrl ?? "";

  return (
    <DocsLayout
      {...(layoutOptions ?? baseOptions())}
      sidebar={{ enabled: false }}
      tree={tree}
    >
      <DocsPage
        breadcrumb={{
          enabled: true,
          includePage: false,
          includeRoot: false,
          includeSeparator: false,
        }}
        footer={{ enabled: false }}
        tableOfContent={{
          enabled: true,
          style: "clerk",
          footer: (
            <div className="flex items-center gap-3 text-muted-foreground">
              <a
                className="hover:underline"
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareHref)}&text=${encodeURIComponent(
                  String(data.title ?? ""),
                )}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                X
              </a>
              <span>·</span>
              <a
                className="hover:underline"
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  shareHref,
                )}`}
                rel="noopener noreferrer"
                target="_blank"
              >
                LinkedIn
              </a>
              <span>·</span>
              <button
                className="max-w-[18rem] truncate"
                onClick={() => {
                  navigator.clipboard.writeText(shareHref);
                  toast.success("Link copied to clipboard");
                }}
                title={shareHref}
                type="button"
              >
                Link
              </button>
            </div>
          ),
        }}
        toc={data.toc}
      >
        {data.cover ? (
          <div className="mb-6 overflow-hidden rounded-xl border bg-muted/30">
            <img
              alt="Cover"
              className="h-64 w-full object-cover"
              src={data.cover}
            />
          </div>
        ) : null}
        <DocsTitle>{data.title}</DocsTitle>
        {data.description ? (
          <DocsDescription>{data.description}</DocsDescription>
        ) : null}
        <DocsBody>
          <MDXRenderer
            code={data.body}
            {...(components ? { components } : {})}
          />
        </DocsBody>
        <div className="mt-10 border-t pt-6">
          <div className="flex items-center justify-between gap-4">
            {prevPost ? (
              <a className="max-w-[45%] hover:underline" href={prevPost.url}>
                ← {prevPost.title ?? "Previous"}
              </a>
            ) : (
              <span />
            )}
            {nextPost ? (
              <a
                className="ml-auto max-w-[45%] text-right hover:underline"
                href={nextPost.url}
              >
                {nextPost.title ?? "Next"} →
              </a>
            ) : null}
          </div>
        </div>
        {relatedPosts.length > 0 ? (
          <div className="mt-10">
            <h3 className="mb-4 font-semibold text-base">Related posts</h3>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {relatedPosts.map((p) => (
                <PostCard
                  cover={p.cover}
                  description={p.description}
                  href={p.url}
                  key={p.url}
                  title={p.title ?? "Untitled"}
                />
              ))}
            </div>
          </div>
        ) : null}
      </DocsPage>
    </DocsLayout>
  );
}
