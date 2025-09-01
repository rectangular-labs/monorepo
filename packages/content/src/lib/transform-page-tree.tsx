import type { PageTree } from "fumadocs-core/server";

export function transformPageTree(tree: PageTree.Folder): PageTree.Folder {
  function page(item: PageTree.Item) {
    if (typeof item.icon !== "string") {
      return item;
    }

    return {
      ...item,
      icon: (
        <span
          // biome-ignore lint/security/noDangerouslySetInnerHtml: from fumadocs
          dangerouslySetInnerHTML={{
            __html: item.icon,
          }}
        />
      ),
    };
  }

  return {
    ...tree,
    ...(tree.icon
      ? { icon: page({ icon: tree.icon } as PageTree.Item).icon }
      : {}),
    ...(tree.index ? { index: page(tree.index) } : {}),
    children: tree.children.map((item) => {
      if (item.type === "page") return page(item);
      if (item.type === "folder") return transformPageTree(item);
      return item;
    }),
  };
}
