import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import type { PageTree } from "fumadocs-core/server";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import type { BaseLayoutProps } from "fumadocs-ui/layouts/links";
import { DocsBody, DocsPage, DocsTitle } from "fumadocs-ui/page";
import type React from "react";
import { baseOptions } from "../lib/layout";
import { transformPageTree } from "../lib/transform-page-tree";

export function ListDocsPage({
  tree,
  layoutOptions,
}: {
  tree: object;
  layoutOptions?: BaseLayoutProps;
}) {
  const parsedTree = tree as PageTree.Folder;
  const transformed = transformPageTree(parsedTree);
  const topLevelFolders = transformed.children
    .flatMap((child) => (child.type === "folder" ? child.children : []))
    .filter(
      (c): c is PageTree.Folder => c.type === "folder" && (c.root ?? false),
    );

  transformed.children = topLevelFolders;

  function getFolderHref(folder: PageTree.Folder): string {
    const indexUrl = folder.index?.url;
    if (typeof indexUrl === "string") return indexUrl;
    const firstPage = folder.children.find((c) => c.type === "page");
    if (firstPage && typeof firstPage.url === "string") return firstPage.url;
    return "#";
  }

  function getFolderIcon(folder: PageTree.Folder): React.ReactNode | undefined {
    if (folder.icon) return folder.icon;
    if (folder.index?.icon) return folder.index.icon;
    const firstPageWithIcon = folder.children.find(
      (c) => c.type === "page" && c.icon,
    );
    return firstPageWithIcon?.icon;
  }

  function getFolderDescription(
    folder: PageTree.Folder,
  ): string | React.ReactNode | undefined {
    if (folder.description) return folder.description;
    if (folder.index?.description) return folder.index.description;
    const firstPageWithDescription = folder.children.find(
      (c) => c.type === "page",
    );
    return firstPageWithDescription?.description;
  }

  return (
    <DocsLayout {...(layoutOptions ?? baseOptions())} tree={transformed}>
      <DocsPage
        breadcrumb={{ enabled: false }}
        footer={{ enabled: false }}
        tableOfContent={{ enabled: false }}
      >
        <DocsTitle>Documentation</DocsTitle>
        <DocsBody>
          <div className="grid gap-6 md:grid-cols-2">
            {topLevelFolders.map((folder) => {
              const href = getFolderHref(folder);
              const icon = getFolderIcon(folder);
              const description = getFolderDescription(folder);
              return (
                <a className="group block no-underline" href={href} key={href}>
                  <Card className="h-full overflow-hidden border-border/60 bg-card/80 shadow-sm ring-1 ring-border/40 transition-all duration-200 hover:-translate-y-0.5 hover:border-border hover:shadow-md">
                    <CardHeader className="flex items-start gap-3">
                      {icon ? (
                        <div className="rounded-md border bg-muted/40 p-2 text-muted-foreground shadow-sm transition-colors group-hover:bg-muted">
                          {icon}
                        </div>
                      ) : null}
                      <div className="space-y-1">
                        <CardTitle className="font-semibold text-base">
                          {folder.name}
                        </CardTitle>
                        {description ? (
                          <CardDescription className="line-clamp-2">
                            {description}
                          </CardDescription>
                        ) : (
                          <CardDescription>
                            Browse {folder.name}
                          </CardDescription>
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                </a>
              );
            })}
          </div>
        </DocsBody>
      </DocsPage>
    </DocsLayout>
  );
}
