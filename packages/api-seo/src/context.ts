import { ORPCError, os } from "@orpc/server";
import {
  asyncStorageMiddleware,
  getContext as getBaseContext,
} from "@rectangular-labs/api-core/lib/context-storage";
import { loggerMiddleware } from "@rectangular-labs/api-core/lib/logger";
import { type Auth, initAuthHandler } from "@rectangular-labs/auth";
import { createDb } from "@rectangular-labs/db";
import { authMiddleware } from "./lib/auth";
import type { InitialContext } from "./types";

export const createApiContext = (args: Omit<InitialContext, "db" | "auth">) => {
  const db = createDb();
  return {
    auth: initAuthHandler(args.url.origin, db) as Auth,
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
  .use(authMiddleware)
  .use(
    // this is mostly useful in dev where we have a non pooler docker link
    os
      .$context<InitialContext>()
      .middleware(async ({ next, context }) => {
        const response = await next();
        await context.db.$client.end();
        return response;
      }),
  );

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
