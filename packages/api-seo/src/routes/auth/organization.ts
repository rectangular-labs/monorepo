import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { getMembersByOrganizationId } from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../../context";
import { validateOrganizationMiddleware } from "../../lib/validate-organization";

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
      members: schema.memberSelectSchema
        .merge(
          type({
            user: schema.userSelectSchema.pick("id", "name", "email", "image"),
          }),
        )
        .array(),
    }),
  )
  .handler(async ({ context }) => {
    const rowsResult = await getMembersByOrganizationId(
      context.db,
      context.organization.id,
    );

    if (!rowsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: rowsResult.error.message,
        cause: rowsResult.error,
      });
    }
    const rows = rowsResult.value;
    return {
      members: rows.map((member) => ({
        ...member,
        user: {
          id: member.user.id,
          name: member.user.name,
          email: member.user.email,
          image: member.user.image ?? null,
        },
      })),
    };
  });

export default protectedBase
  .prefix("/organization")
  .router({ active, setActive, list, members });
