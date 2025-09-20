import { authEnv } from "@rectangular-labs/auth/env";
import { dbEnv } from "@rectangular-labs/db/env";
import { taskEnv } from "@rectangular-labs/task/env";
import { createEnv } from "@t3-oss/env-core";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(), authEnv(), taskEnv()],
    server: {},
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
