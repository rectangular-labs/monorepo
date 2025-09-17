import type { KnipConfig } from "knip";

export default {
  ignore: ["**/.sst/**", "**/routeTree.gen.ts"],
  biome: {
    config: ["biome.jsonc"],
  },
  workspaces: {
    ".": {
      entry: ["turbo/generators/config.ts"],
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
    css: (text: string) => {
      const atRuleImports = Array.from(
        text.matchAll(/(?<=@)(import|plugin)[^;]+/g),
        (match) => match[0].replace(/^plugin/, "import"),
      );

      // Also include url(...) references that look like bare package specifiers
      // e.g. url(@fontsource-variable/...) → import "@fontsource-variable/..."
      const urlImports = Array.from(
        text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/g),
        (match) => match[2]?.trim(),
      )
        .filter((value) => {
          if (value?.startsWith("@")) return true;
          return false;
        })
        .map((specifier) => `import "${specifier}"`);

      return [...atRuleImports, ...urlImports].join("\n");
    },
  },
} satisfies KnipConfig;
