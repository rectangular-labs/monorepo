import { createMDXSource } from "@fumadocs/content-collections";
import { loader } from "fumadocs-core/source";
import * as icons from "lucide-static";
import { allDocs, allMetas } from "../.content-collections/generated";

export const source = loader({
  source: createMDXSource(allDocs, allMetas),
  baseUrl: "/docs",
  icon(icon) {
    if (!icon) return;

    // biome-ignore lint/performance/noDynamicNamespaceImportAccess: We need to access the icons dynamically
    if (icon in icons) return icons[icon as keyof typeof icons];

    return;
  },
  // url(slug, locale) {
  //   console.log({ slug, locale });
  //   return `/docs/${slug.join("/")}`;
  // },
  // slugs(info) {
  //   // console.log("info", info);
  //   console.log("split", info.path.split("/").slice(2));
  //   const path = info.path.split("/").slice(1).slice(0, -1);

  //   console.log("[path[1], path[0], ...path.slice(2)]", [
  //     path[1],
  //     path[0],
  //     ...path.slice(2),
  //   ]);
  //   return info.path.split("/");
  // },
});
