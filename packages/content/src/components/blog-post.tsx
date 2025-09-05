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
import { useEffect, useMemo, useState } from "react";
import type { ExtractedPost } from "../lib/get-posts-overview";
import { baseOptions } from "../lib/layout";
import { transformPageTree } from "../lib/transform-page-tree";
import type { blogSource } from "../source";
import { MDXRenderer } from "./mdx-renderer";

export function BlogPost({
  data,
  tree: dataTree,
  postsOverview,
  layoutOptions,
  components,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: generic to support any page type
  tree: LoaderOutput<any>["pageTree"] | object;
  data: NonNullable<ReturnType<typeof blogSource.getPage>>["data"];
  postsOverview: ExtractedPost[];
  layoutOptions?: BaseLayoutProps;
  components?: MDXComponents;
}) {
  const [currentUrl, setCurrentUrl] = useState<undefined | string>(undefined);
  useEffect(() => {
    if (typeof window !== "undefined") {
      setCurrentUrl(window.location.href);
    }
  }, []);
  const tree = useMemo(
    // cast from fumadocs https://fumadocs.dev/docs/ui/manual-installation/tanstack-start
    () => transformPageTree(dataTree as PageTree.Folder),
    [dataTree],
  );
  const shareHref = currentUrl ?? "";
  const currentIndex = useMemo(
    () =>
      currentUrl ? postsOverview.findIndex((p) => p.url === currentUrl) : -1,
    [postsOverview, currentUrl],
  );
  const prevPost =
    currentIndex > 0 ? postsOverview[currentIndex - 1] : undefined;
  const nextPost =
    currentIndex >= 0 && currentIndex < postsOverview.length - 1
      ? postsOverview[currentIndex + 1]
      : undefined;

  return (
    <DocsLayout
      containerProps={{
        className: "max-w-5xl mx-auto",
      }}
      {...(layoutOptions ?? baseOptions())}
      sidebar={{ enabled: false }}
      tree={tree}
    >
      <DocsPage
        breadcrumb={{
          enabled: false,
        }}
        editOnGithub={{
          owner: "rectangular-labs",
          repo: "monorepo",
          sha: "main",
          path: `packages/content/posts/${data._meta.fileName}`,
        }}
        footer={{
          enabled: true,
        }}
        full
        {...(data.lastModified ? { lastUpdate: data.lastModified } : {})}
        tableOfContent={{
          enabled: true,
          style: "clerk",
          header: <div className="py-6" />,
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
        tableOfContentPopover={{
          enabled: false,
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
      </DocsPage>
    </DocsLayout>
  );
}
