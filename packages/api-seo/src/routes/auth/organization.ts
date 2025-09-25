import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../../context";

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
  .route({ method: "POST", path: "/set-default" })
  .input(
    type({ organizationId: "string|null", organizationSlug: "string|null" }),
  )
  .output(schema.organizationSelectSchema.or(type.null))
  .handler(async ({ context, input }) => {
    const organization = await context.auth.api
      .setActiveOrganization({
        ...(context.reqHeaders ? { headers: context.reqHeaders } : {}),
        body: {
          organizationId: input.organizationId ?? undefined,
          organizationSlug: input.organizationSlug ?? undefined,
        },
        returnHeaders: true,
      })
      .catch((e) => {
        if (e.statusCode === 400) {
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
    const organizations = await context.auth.api.listOrganizations({
      ...(context.reqHeaders ? { headers: context.reqHeaders } : {}),
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

export default protectedBase
  .prefix("/organization")
  .router({ active, setActive, list });
