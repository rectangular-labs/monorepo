import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../../context";
import { validateOrganizationMiddleware } from "../../lib/middleware/validate-organization";

const active = protectedBase
  .route({ method: "GET", path: "/active" })
  .input(type.undefined)
  .output(schema.organizationSelectSchema.or(type("null")))
  .handler(async ({ context }) => {
    const { activeOrganizationId } = context.session;
    if (!activeOrganizationId) {
      return null;
    }
    const organization = await context.db.query.organization.findFirst({
      where: (table, { eq }) => eq(table.id, activeOrganizationId),
    });
    if (!organization) {
      return null;
    }
    return { ...organization, slug: organization.slug ?? "" };
  });

const setActive = protectedBase
  .route({ method: "POST", path: "/set-active" })
  .input(
    type({ organizationId: "string|null", organizationSlug: "string|null" }),
  )
  .output(schema.organizationSelectSchema.or(type.null))
  .handler(async ({ context, input }) => {
    if (!context.reqHeaders) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Missing request headers",
      });
    }
    const organization = await context.auth.api
      .setActiveOrganization({
        headers: context.reqHeaders,
        body: {
          organizationId: input.organizationId ?? undefined,
          organizationSlug: input.organizationSlug ?? undefined,
        },
        returnHeaders: true,
      })
      .catch((e) => {
        if (e.statusCode >= 400 && e.statusCode < 500) {
          return null;
        }
        throw e;
      });

    if (!organization?.response) {
      return null;
    }
    for (const [key, value] of organization.headers.entries()) {
      context.resHeaders?.append(key, value);
    }
    return {
      ...organization.response,
      logo: organization.response?.logo ?? null,
      metadata: organization.response?.metadata ?? null,
    };
  });

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(type.undefined)
  .output(schema.organizationSelectSchema.array())
  .handler(async ({ context }) => {
    if (!context.reqHeaders) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Missing request headers",
      });
    }
    const organizations = await context.auth.api.listOrganizations({
      headers: context.reqHeaders,
    });
    if (!organizations) {
      return [];
    }
    return organizations.map((organization) => ({
      ...organization,
      logo: organization?.logo ?? null,
      metadata: organization?.metadata ?? null,
    }));
  });

const members = protectedBase
  .route({ method: "GET", path: "/members" })
  .input(type({ organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      members: type({
        "...": schema.memberSelectSchema,
        user: schema.userSelectSchema.pick("id", "name", "email", "image"),
      }).array(),
      total: "number",
    }),
  )
  .handler(async ({ context }) => {
    if (!context.reqHeaders) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Missing request headers",
      });
    }

    const result = await context.auth.api.listMembers({
      headers: context.reqHeaders,
      query: {
        organizationId: context.organization.id,
        sortBy: "createdAt",
        sortDirection: "desc",
      },
    });

    return {
      members: result.members.map((member) => ({
        ...member,
        user: {
          ...member.user,
          image: member.user.image ?? null,
        },
      })),
      total: result.total ?? result.members.length,
    };
  });

const invitations = protectedBase
  .route({ method: "GET", path: "/invitations" })
  .input(type({ organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      invitations: schema.invitationSelectSchema.array(),
    }),
  )
  .handler(async ({ context }) => {
    if (!context.reqHeaders) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Missing request headers",
      });
    }

    const result = await context.auth.api.listInvitations({
      headers: context.reqHeaders,
      query: {
        organizationId: context.organization.id,
      },
    });

    // Filter to only pending invitations
    const pendingInvitations = result.filter(
      (invitation) => invitation.status === "pending",
    );

    return {
      invitations: pendingInvitations.map((invitation) => ({
        ...invitation,
      })),
    };
  });

export default protectedBase
  .prefix("/organization")
  .router({ active, setActive, list, members, invitations });
