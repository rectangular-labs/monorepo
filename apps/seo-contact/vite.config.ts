import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { generateSitemap } from "tanstack-router-sitemap";
import mkcert from "vite-plugin-mkcert";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { sitemap } from "./src/lib/sitemap";

const shouldSkipEnvValidation =
  !!process.env.CI || process.env.npm_lifecycle_event === "lint";
if (!shouldSkipEnvValidation && !process.env.VITE_WWW_URL) {
  throw new Error("Missing VITE_WWW_URL for seo-contact build.");
}

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    mkcert(),
    generateSitemap(sitemap),
    tanstackStart({
      prerender: {
        enabled: true,
        crawlLinks: true,
        concurrency: 14,
        // Number of times to retry a failed prerender job
        retryCount: 2,
        // Delay between retries in milliseconds
        retryDelay: 1000,
        // Callback when page is successfully rendered
        onSuccess: ({ page }) => {
          console.log(`Rendered ${page.path}!`);
        },
      },
    }),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    viteReact(),
  ],
  server: {
    port: 4242,
  },
});

export default config;
