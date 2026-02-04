import { ThemeProvider } from "@rectangular-labs/ui/components/theme-provider";
import type { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { seo } from "~/lib/seo";
import appCss from "../styles.css?url";

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
}>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      ...seo({
        title: "Fluid Posts Contact Links",
        description:
          "Quick contact links for Aaron Leong and Winston Yeo at Fluid Posts.",
        keywords: "Fluid Posts, contact, Aaron Leong, Winston Yeo",
      }),
    ],
    links: [
      {
        rel: "preload",
        href: appCss,
        as: "style",
        fetchPriority: "high",
      },
      { rel: "stylesheet", href: appCss },
      {
        rel: "apple-touch-icon",
        sizes: "180x180",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "icon",
        type: "image/png",
        sizes: "96x96",
        href: "/favicon-96x96.png",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        sizes: "any",
        href: "/favicon.svg",
      },
      {
        rel: "icon",
        type: "image/x-icon",
        href: "/favicon.ico",
      },
      { rel: "manifest", href: "/site.webmanifest", color: "#000000" },
    ],
  }),
  component: RootLayout,
});

function RootLayout() {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <ThemeProvider attribute="class" enableSystem>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              <Outlet />
            </div>
          </div>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
