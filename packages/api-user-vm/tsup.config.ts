import { defineConfig } from "tsup";

export default defineConfig((options) => {
  const isWatch = options.watch;
  return {
    ...options,
    entry: [
      "src/index.ts",
      "src/client.ts",
      "src/context.ts",
      "src/container.ts",
      "src/env.ts",
      "src/types.ts",
    ],
    format: ["esm" as const],
    splitting: true, //technically true by default for esm, but we'll be explicit
    noExternal: [
      "@rectangular-labs/api-core",
      "@rectangular-labs/auth",
      "@rectangular-labs/db",
    ],
    sourcemap: !isWatch,
    minify: !isWatch,
    onSuccess: "tsc",
  };
});
