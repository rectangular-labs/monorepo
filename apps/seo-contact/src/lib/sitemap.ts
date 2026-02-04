import type { Sitemap } from "tanstack-router-sitemap";
import type { FileRouteTypes } from "~/routeTree.gen";
export type TRoutes = FileRouteTypes["fullPaths"];
const siteUrl = process.env.VITE_WWW_URL ?? "https://contact.fluidposts.com";

export const sitemap: Sitemap<TRoutes> = {
  siteUrl,
  defaultPriority: 0.5,
  routes: {
    "/": {
      priority: 1,
      changeFrequency: "daily",
    },
    "/aaron": {
      priority: 0.8,
      changeFrequency: "monthly",
    },
    "/winston": {
      priority: 0.8,
      changeFrequency: "monthly",
    },
  },
};
