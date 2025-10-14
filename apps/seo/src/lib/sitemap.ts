import { seoBlogSource } from "@rectangular-labs/content";
import type { Sitemap } from "tanstack-router-sitemap";
import type { FileRouteTypes } from "~/routeTree.gen";
export type TRoutes = FileRouteTypes["fullPaths"];

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
    "/blog/$": () => {
      return seoBlogSource.generateParams().map((params) => ({
        path: `/blog/${params.slug}`,
        priority: 0.8,
        changeFrequency: "weekly",
      }));
    },
  },
};
