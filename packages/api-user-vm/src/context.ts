import { os } from "@orpc/server";
import {
  asyncStorageMiddleware,
  getContext as getBaseContext,
} from "@rectangular-labs/api-core/lib/context-storage";
import { loggerMiddleware } from "@rectangular-labs/api-core/lib/logger";
import { createDb } from "@rectangular-labs/db";
import type { InitialContext } from "./types";

export const createApiContext = (args: Omit<InitialContext, "db" | "auth">) => {
  const db = createDb();
  return {
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
  .use(asyncStorageMiddleware<InitialContext>());

export const getContext = getBaseContext<InitialContext>;
