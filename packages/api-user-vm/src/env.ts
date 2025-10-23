import { dbEnv } from "@rectangular-labs/db/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv()],
    server: { ANTHROPIC_API_KEY: type("string") },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
