import type { Sitemap } from "tanstack-router-sitemap";
import type { FileRouteTypes } from "~/routeTree.gen";
export type TRoutes = FileRouteTypes["fullPaths"];

import type { seoBlogSource as blogSource } from "@rectangular-labs/content";
import { createJiti } from "jiti";

export const sitemap: Sitemap<TRoutes> = {
  siteUrl: "https://www.fluidposts.com",
  defaultPriority: 0.5,
  routes: {
    "/": {
      priority: 1,
      changeFrequency: "daily",
    },
    "/blog": {
      priority: 0.8,
      changeFrequency: "daily",
    },
    // Dynamic route example
    "/blog/$": async () => {
      const jiti = createJiti(import.meta.url);
      const { seoBlogSource } = (await jiti.import(
        "@rectangular-labs/content",
      )) as {
        seoBlogSource: typeof blogSource;
      };

      return seoBlogSource.generateParams().map((params) => ({
        path: `/blog/${params.slug}`,
        priority: 0.8,
        changeFrequency: "weekly",
      }));
    },
  },
};
