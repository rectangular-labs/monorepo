import { authEnv } from "@rectangular-labs/auth/env";
import { dbEnv } from "@rectangular-labs/db/env";
import { taskEnv } from "@rectangular-labs/task/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(), authEnv(), taskEnv()],
    server: {
      AUTH_GOOGLE_CLIENT_ID: type("string"),
      AUTH_GOOGLE_CLIENT_SECRET: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
