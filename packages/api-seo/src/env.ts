import { authEnvSchema } from "@rectangular-labs/api-core/lib/auth";
import { dbEnv } from "@rectangular-labs/db/env";
import { taskEnv } from "@rectangular-labs/task/env";
import { createEnv } from "@t3-oss/env-core";
import { type } from "arktype";

export const apiEnv = () =>
  createEnv({
    extends: [dbEnv(), taskEnv()],
    server: {
      ...authEnvSchema,
      SEO_PUBLIC_BUCKET_URL: type("string"),
      CLOUDFLARE_ACCOUNT_ID: type("string"),
      CLOUDFLARE_R2_ACCESS_KEY_ID: type("string"),
      CLOUDFLARE_R2_SECRET_ACCESS_KEY: type("string"),
      CLOUDFLARE_R2_ORG_STORAGE_BUCKET_NAME: type("string"),
      CLOUDFLARE_BROWSER_RENDERING_API_TOKEN: type("string"),
      UNSPLASH_API_KEY: type("string"),
      PEXELS_API_KEY: type("string"),
      PIXABAY_API_KEY: type("string"),
      SCREENSHOTONE_API_KEY: type("string"),
    },
    runtimeEnv: process.env,
    emptyStringAsUndefined: true,
  });
