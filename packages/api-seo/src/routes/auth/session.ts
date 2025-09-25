import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { base, protectedBase } from "../../context";

const current = base
  .route({ method: "GET", path: "/current" })
  .input(type.undefined)
  .output(
    type({
      session: schema.sessionSelectSchema,
      user: schema.userSelectSchema,
    }).or(type.null),
  )
  .handler(async ({ context }) => {
    if (!context.reqHeaders) {
      return null;
    }
    const result = await context.auth.api.getSession({
      headers: context.reqHeaders,
    });

    if (!result) {
      return null;
    }
    return {
      session: {
        ...result.session,
        ipAddress: result.session.ipAddress ?? null,
        userAgent: result.session.userAgent ?? null,
        activeOrganizationId: result.session.activeOrganizationId ?? null,
      },
      user: {
        ...result.user,
        image: result.user.image ?? null,
        twoFactorEnabled: result.user.twoFactorEnabled ?? null,
        source: result.user.source ?? null,
        goal: result.user.goal ?? null,
      },
    };
  });

const signOut = protectedBase
  .route({ method: "POST", path: "/sign-out" })
  .input(type.undefined)
  .output(type({ success: "boolean" }))
  .handler(async ({ context }) => {
    if (!context.reqHeaders) {
      return { success: false };
    }
    const result = await context.auth.api.signOut({
      headers: context.reqHeaders,
      returnHeaders: true,
    });
    for (const [key, value] of result.headers.entries()) {
      context.resHeaders?.append(key, value);
    }
    return result.response;
  });

export default base.prefix("/session").router({ current, signOut });
