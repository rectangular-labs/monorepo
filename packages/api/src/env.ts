import { authEnv } from "@rectangular-labs/auth/env";
import { dbEnv } from "@rectangular-labs/db/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(), authEnv()],
    server: {
      GOOGLE_GENERATIVE_AI_API_KEY: type("string|undefined"),
      AI_MODEL: type("string|undefined"),
      REDDIT_USER_AGENT: type("string|undefined"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
