import { ORPCError, os } from "@orpc/server";
import {
  asyncStorageMiddleware,
  getContext as getBaseContext,
} from "@rectangular-labs/api-core/lib/context-storage";
import { loggerMiddleware } from "@rectangular-labs/api-core/lib/logger";
import { type Auth, initAuthHandler } from "@rectangular-labs/auth";
import { createDb } from "@rectangular-labs/db";
import { apiEnv } from "./env";
import { authMiddleware } from "./lib/auth";
import type { InitialContext } from "./types";

export const createApiContext = (args: Omit<InitialContext, "db" | "auth">) => {
  const db = createDb();
  const env = apiEnv();
  return {
    auth: initAuthHandler({
      baseURL: args.url.origin,
      db,
      encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
      fromEmail: env.AUTH_SEO_FROM_EMAIL,
      inboundApiKey: env.SEO_INBOUND_API_KEY,
      credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
      discordClientId: env.AUTH_SEO_DISCORD_ID,
      discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
      githubClientId: env.AUTH_SEO_GITHUB_ID,
      githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
      googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
      googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
    }) as Auth,
    db,
    ...args,
  };
};

/**
 * Base oRPC instance with typed initial context
 * Use this instead of the raw `os` import for type-safe dependency injection
 */
export const base = os
  .$context<InitialContext>()
  .use(loggerMiddleware)
  .use(asyncStorageMiddleware<InitialContext>())
  .use(authMiddleware);

export const protectedBase = base.use(({ context, next }) => {
  const session = context.session;
  const user = context.user;
  if (!session || !user) {
    throw new ORPCError("UNAUTHORIZED");
  }
  return next({
    context: {
      session,
      user,
    },
  });
});
export const withOrganizationIdBase = protectedBase.use(({ context, next }) => {
  const { session } = context;
  const activeOrganizationId = session.activeOrganizationId;
  if (!activeOrganizationId) {
    throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
  }
  return next({
    context: {
      session: {
        ...session,
        activeOrganizationId,
      },
    },
  });
});

export const getContext = getBaseContext<InitialContext>;
