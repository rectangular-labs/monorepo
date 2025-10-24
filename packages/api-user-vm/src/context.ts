import { ORPCError, os } from "@orpc/server";
import { authMiddleware } from "@rectangular-labs/api-core/lib/auth";
import {
  asyncStorageMiddleware,
  getContext as getBaseContext,
} from "@rectangular-labs/api-core/lib/context-storage";
import { loggerMiddleware } from "@rectangular-labs/api-core/lib/logger";
import type { InitialContext } from "./types";

/**
 * Base oRPC instance with typed initial context
 * Use this instead of the raw `os` import for type-safe dependency injection
 */
const base = os
  .$route({
    path: "/api/user-vm",
  })
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

export const getContext = getBaseContext<InitialContext>;
