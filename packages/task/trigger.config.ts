import { syncEnvVars } from "@trigger.dev/build/extensions/core";
import { playwright } from "@trigger.dev/build/extensions/playwright";
import { defineConfig } from "@trigger.dev/sdk";
import packageJson from "./package.json";
import { taskEnv } from "./src/env";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_ID ?? "",
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 1800,
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
  build: {
    external: ["crawlee", "jsdom"],
    extensions: [
      playwright({
        browsers: ["chromium"],
        headless: true,
        version: packageJson.dependencies.playwright,
      }),
      syncEnvVars(() => {
        try {
          const env = taskEnv();

          return Object.entries(env).map(([key, value]) => ({
            name: key,
            value,
          }));
        } catch {
          process.exit(1);
        }
      }),
    ],
  },
  dirs: ["src/trigger"],
});
