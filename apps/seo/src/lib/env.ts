import { apiEnv } from "@rectangular-labs/api-seo/env";
import { userVmApiEnv } from "@rectangular-labs/api-user-vm/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const clientEnv = () =>
  createEnv({
    extends: [],
    clientPrefix: "VITE_",
    client: {
      VITE_SEO_URL: type("string"),
      VITE_AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE: type("'code' | 'token'"),
    },
    runtimeEnv: import.meta.env,
    emptyStringAsUndefined: true,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });

export const serverEnv = () =>
  createEnv({
    extends: [clientEnv(), apiEnv(), userVmApiEnv()],
    server: {
      NODE_ENV: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
    skipValidation:
      !!process.env.CI || process.env.npm_lifecycle_event === "lint",
  });
