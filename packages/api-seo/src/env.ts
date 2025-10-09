import { dbEnv } from "@rectangular-labs/db/env";
import { taskEnv } from "@rectangular-labs/task/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(),  taskEnv()],
    server: {
      AUTH_SEO_ENCRYPTION_KEY: type("string"),
      AUTH_SEO_DISCORD_ID: type("string"),
      AUTH_SEO_DISCORD_SECRET: type("string"),
      AUTH_SEO_GITHUB_ID: type("string"),
      AUTH_SEO_GITHUB_SECRET: type("string"),
      AUTH_SEO_GOOGLE_CLIENT_ID: type("string"),
      AUTH_SEO_GOOGLE_CLIENT_SECRET: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
