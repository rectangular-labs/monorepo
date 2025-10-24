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
      USER_VM_PORT: type("string|undefined"),
      USER_VM_HOST: type("string|undefined"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
