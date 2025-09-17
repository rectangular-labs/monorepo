import type { KnipConfig } from "knip";

export default {
  ignore: ["**/.sst/**", "**/routeTree.gen.ts"],
  workspaces: {
    ".": {
      entry: "turbo/generators/config.ts",
      project: "turbo/generators/**/*.ts",
    },
    "packages/*": {
      entry: ["**/src/**/*.{ts,tsx}"],
      project: ["**/src/**/*.{ts,tsx}"],
    },
    "apps/*": {
      entry: ["**/src/router.tsx", "**/src/routes/__root.tsx"],
      project: ["**/src/**/*.{ts,tsx}"],
      vite: {
        config: ["**/vite.config.ts"],
      },
    },
  },
  compilers: {
    // support parsing css for tailwind imports
    // https://github.com/webpro-nl/knip/issues/1008#issuecomment-3207756199
    css: (text: string) =>
      [
        ...text.replaceAll("plugin", "import").matchAll(/(?<=@)import[^;]+/g),
      ].join("\n"),
  },
} satisfies KnipConfig;
