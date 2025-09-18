import { playwright } from "@trigger.dev/build/extensions/playwright";
import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_ybfrijjvtusiailrndnt",
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
    extensions: [playwright()],
  },
  dirs: ["src/trigger"],
});
