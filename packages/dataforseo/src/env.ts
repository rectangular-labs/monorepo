import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const dataForSeoEnv = () =>
  createEnv({
    server: {
      DATAFORSEO_USERNAME: type("string"),
      DATAFORSEO_PASSWORD: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
