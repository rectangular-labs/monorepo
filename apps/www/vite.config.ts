import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

import { resolve } from "node:path";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [
    TanStackRouterVite({ autoCodeSplitting: true }),
    viteReact(),
    tailwindcss(),
    mkcert(),
  ],
  test: {
    globals: true,
    environment: "jsdom",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: `${process.env.VITE_APP_URL?.split("://")[0]}://${process.env.VITE_BASIC_AUTH_USERNAME}:${process.env.VITE_BASIC_AUTH_PASSWORD}@${process.env.VITE_APP_URL?.split("://")[1]}`,
        changeOrigin: true,
      },
    },
  },
});
