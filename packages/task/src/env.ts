import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const taskEnv = () =>
  createEnv({
    server: {
      TRIGGER_PROJECT_ID: type("string"),
      TRIGGER_SECRET_KEY: type("string"),
      GOOGLE_GENERATIVE_AI_API_KEY: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
