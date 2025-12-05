import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "packages/*",
      {
        // add "extends: true" to inherit the options from the root config
        extends: true,
        test: {
          include: ["apps/seo/**/*.test.{ts,tsx}"],
          // it is recommended to define a name when using inline configs
          name: "seo",
          environment: "jsdom",
          globals: true,
        },
      },
    ],
  },
});
