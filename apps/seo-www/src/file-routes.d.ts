export {};

declare module "@tanstack/react-router" {
  // TanStack Router file-route typing for manually-added routes.
  // This repo usually auto-generates these, but seo-www commits `routeTree.gen.ts`.
  // Keeping this small augmentation prevents `createFileRoute("/...")` from erroring
  // when we add new routes without regenerating.
  interface FileRoutesByPath {
    "/founders": unknown;
    "/seo-experts": unknown;
  }
}

