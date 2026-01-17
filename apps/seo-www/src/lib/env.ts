import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const clientEnv = () =>
  createEnv({
    extends: [],
    clientPrefix: "VITE_",
    client: {
      VITE_WWW_URL: type("string"),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });

export const serverEnv = () =>
  createEnv({
    extends: [clientEnv()],
    server: {
      APOLLO_CONTACT_API_KEY: type("string"),
      TELEGRAM_BOT_TOKEN: type("string"),
      TELEGRAM_CHAT_ID: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
