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
import { transformPageTree } from "../lib/transform-page-tree";
import type { docSource } from "../source";
import { MDXRenderer } from "./mdx-renderer";

export function DocPage({
  data,
  tree: dataTree,
  layoutOptions,
  components,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: generic to support any page type
  tree: LoaderOutput<any>["pageTree"] | object;
  data: NonNullable<ReturnType<typeof docSource.getPage>>["data"];
  layoutOptions?: BaseLayoutProps;
  components?: MDXComponents;
}) {
  const tree = useMemo(
    // cast from fumadocs https://fumadocs.dev/docs/ui/manual-installation/tanstack-start
    () => transformPageTree(dataTree as PageTree.Folder),
    [dataTree],
  );

  return (
    <DocsLayout {...(layoutOptions ?? baseOptions())} tree={tree}>
      <DocsPage
        breadcrumb={{
          enabled: true,
          includePage: true,
          includeSeparator: false,
          includeRoot: true,
        }}
        footer={{ enabled: true }}
        {...(data.lastModified ? { lastUpdate: data.lastModified } : {})}
        tableOfContent={{
          enabled: true,
          style: "clerk",
        }}
        toc={data.toc}
      >
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
      </DocsPage>
    </DocsLayout>
  );
}
