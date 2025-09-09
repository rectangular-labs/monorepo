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
        name: "apple-mobile-web-app-capable",
        content: "yes",
      },
      {
        name: "apple-mobile-web-app-title",
        content: "Rectangular Labs",
      },
      {
        name: "application-name",
        content: "Rectangular Labs",
      },
      ...seo({
        title:
          "Rectangular Labs — Bootstrapped, customer-obsessed technology studio",
        description:
          "We build and launch high-craft products: Result, Emails, and a production-ready monorepo starter.",
      }),
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap",
      },
      {
        rel: "preconnect",
        href: "https://fonts.cdnfonts.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "alternate",
        type: "application/rss+xml",
        href: "/blog/rss.xml",
        title: "Blog RSS",
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
    <html lang="en">
      <head>
        <script data-cfasync="false">
          {`!function(){try{var e=localStorage.theme;var n=e==='dark'||(!e&&window.matchMedia('(prefers-color-scheme: dark)').matches);var t=document.documentElement;n?t.classList.add('dark'):t.classList.remove('dark')}catch(o){}}();`}
        </script>
        <script async={false} data-cfasync="false">
          {`!${(
            () => {
              try {
                const theme = localStorage.theme;
                const prefersDark = window.matchMedia(
                  "(prefers-color-scheme: dark)",
                ).matches;
                const isDark = theme === "dark" || (!theme && prefersDark);
                if (isDark) {
                  document.documentElement.classList.add("dark");
                } else {
                  document.documentElement.classList.remove("dark");
                }
              } catch {
                // noop
              }
            }
          ).toString()}();`}
        </script>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          // Enable when scripts here are working as intended.
          // cloudflare magic see https://github.com/pacocoursey/next-themes?tab=readme-ov-file#using-with-cloudflare-rocket-loader
          // scriptProps={{ "data-cfasync": "false", async: false }}
        >
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
