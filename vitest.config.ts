import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: ["packages/*"],
    // https://vitest.dev/guide/reporters.html#github-actions-reporter
    reporters: process.env.GITHUB_ACTIONS ? ["dot", "github-actions"] : ["dot"],
    coverage: {
      provider: "v8",
    },
  },
});
