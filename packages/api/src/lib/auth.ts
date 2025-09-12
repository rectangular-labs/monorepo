import { os } from "@orpc/server";
import type { Session } from "@rectangular-labs/auth";
import type { InitialContext } from "../types";

export const authMiddleware = os
  .$context<InitialContext>()
  .middleware(async ({ next, context }) => {
    const auth = context.auth;
    const session = (await auth.api.getSession({
      headers: context.reqHeaders ?? new Headers(),
    })) as Session;

    return await next({
      context: {
        ...context,
        session,
      },
    });
  });
