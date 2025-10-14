import { ThemeProvider } from "@rectangular-labs/ui/components/theme-provider";
import { Toaster } from "@rectangular-labs/ui/components/ui/sonner";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import {
  createRootRouteWithContext,
  HeadContent,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
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
      {
        name: "apple-mobile-web-app-title",
        content: "Fluid Posts",
      },
      {
        name: "application-name",
        content: "Fluid Posts",
      },
      ...seo({
        title:
          "Fluid Posts — AI SEO employee that Understands, Plans, Forecasts, and Ships",
        description:
          "Fluid Posts analyzes your site, plans campaigns by intent, forecasts ranking ranges, and schedules content that actually ranks.",
        keywords:
          "AI SEO employee, SEO automation, SEO forecasting, SEO, Keyword research, content calendar, keyword clusters",
      }),
    ],
    links: [
      {
        rel: "preload",
        href: appCss,
        as: "style",
        fetchPriority: "high",
      },
      {
        rel: "alternate",
        type: "application/rss+xml",
        href: "/blog/rss.xml",
        title: "Fluid Posts Blog RSS",
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
      { rel: "manifest", href: "/site.webmanifest", color: "#fffff" },
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
          <Outlet />
          <Toaster />
        </ThemeProvider>
        <TanStackRouterDevtools position="bottom-left" />
        <ReactQueryDevtools buttonPosition="bottom-right" />
        <Scripts />
      </body>
    </html>
  );
}

// reportWebVitals(typeof window!== 'undefined' ?console.log : undefined);
