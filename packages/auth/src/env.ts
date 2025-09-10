import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const authEnv = () =>
  createEnv({
    server: {
      AUTH_ENCRYPTION_KEY: type("string >= 32"),
      AUTH_DISCORD_ID: type("string|undefined"),
      AUTH_DISCORD_SECRET: type("string|undefined"),
      AUTH_GITHUB_ID: type("string|undefined"),
      AUTH_GITHUB_SECRET: type("string|undefined"),
      AUTH_REDDIT_ID: type("string|undefined"),
      AUTH_REDDIT_SECRET: type("string|undefined"),
    },
    runtimeEnv:
      typeof window !== "undefined"
        ? (import.meta as unknown as { env: Record<string, string> }).env
        : process.env,
    emptyStringAsUndefined: true,
  });
