import { os } from "@orpc/server";
import { type } from "arktype";
import type { BaseContextWithAuth } from "./types";

export const authMiddleware = os
  .$context<BaseContextWithAuth>()
  .middleware(async ({ next, context }) => {
    const auth = context.auth;
    const session = await auth.api.getSession({
      headers: context.reqHeaders ?? new Headers(),
    });

    return await next({
      context: {
        ...session,
      },
    });
  });

export const authEnvSchema = {
  SEO_INBOUND_API_KEY: type("string"),
  AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE: type("'code' | 'token'"),
  AUTH_SEO_FROM_EMAIL: type("string.email"),
  AUTH_SEO_ENCRYPTION_KEY: type("string"),
  AUTH_SEO_DISCORD_ID: type("string"),
  AUTH_SEO_DISCORD_SECRET: type("string"),
  AUTH_SEO_GITHUB_ID: type("string"),
  AUTH_SEO_GITHUB_SECRET: type("string"),
  AUTH_SEO_GOOGLE_CLIENT_ID: type("string"),
  AUTH_SEO_GOOGLE_CLIENT_SECRET: type("string"),
};
