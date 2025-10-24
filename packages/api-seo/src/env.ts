import { authEnvSchema } from "@rectangular-labs/api-core/lib/auth";
import { dbEnv } from "@rectangular-labs/db/env";
import { taskEnv } from "@rectangular-labs/task/env";
import { createEnv } from "@t3-oss/env-core";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(), taskEnv()],
    server: {
      ...authEnvSchema,
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
