import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const clientEnv = () =>
  createEnv({
    extends: [],
    clientPrefix: "VITE_",
    client: {
      VITE_AARON_EMAIL: type("string"),
      VITE_AARON_PHONE: type("string"),
      VITE_WINSTON_EMAIL: type("string"),
      VITE_WINSTON_PHONE: type("string"),
      VITE_WWW_URL: type("string"),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
