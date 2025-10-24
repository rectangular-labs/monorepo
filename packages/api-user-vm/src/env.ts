import { authEnvSchema } from "@rectangular-labs/api-core/lib/auth";
import { dbEnv } from "@rectangular-labs/db/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const userVmApiEnv = () =>
  createEnv({
    extends: [dbEnv()],
    server: {
      ...authEnvSchema,
      ANTHROPIC_API_KEY: type("string"),
      PORT: type("number|undefined"),
      HOST: type("string|undefined"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
