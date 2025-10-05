import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const googleApisEnv = () =>
  createEnv({
    server: {
      AUTH_GOOGLE_CLIENT_ID: type("string"),
      AUTH_GOOGLE_CLIENT_SECRET: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
