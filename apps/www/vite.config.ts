import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import mkcert from "vite-plugin-mkcert";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";
import { serverEnv } from "./src/lib/env";

// validate env
serverEnv();

const config = defineConfig({
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    mkcert(),
    tanstackStart(),
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    viteReact(),
  ],
  server: {
    port: 6969,
  },
});

export default config;
