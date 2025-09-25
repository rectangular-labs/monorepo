import { ORPCError, os } from "@orpc/server";
import type { Session } from "@rectangular-labs/auth";
import { member } from "../../../db/src/schema/auth-schema";
import type { InitialContext } from "../types";

export const validateOrganizationMiddleware = os
  .$context<InitialContext & Session>()
  .middleware(async ({ next, context }, identifier: string) => {
    const organization = await context.db.query.organization.findFirst({
      where: (table, { eq, or }) =>
        or(eq(table.slug, identifier), eq(table.id, identifier)),
    });

    if (!organization) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid Organization Identifier",
      });
    }
    context.db.query.member.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.organizationId, organization.id),
          eq(table.userId, context.user.id),
        ),
    });
    if (!member) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid Organization Identifier",
      });
    }

    return await next({
      context: {
        organization,
      },
    });
  });
