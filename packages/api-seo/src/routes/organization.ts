import { type } from "arktype";
import { protectedBase } from "../context";

const active = protectedBase
  .route({ method: "GET", path: "/active" })
  .input(type.undefined)
  .output(
    type({
      id: "string",
      name: "string",
      slug: "string|null",
      logo: "string|null",
      createdAt: "Date",
      metadata: "string|null",
    }).or(type("null")),
  )
  .handler(async ({ context }) => {
    const { activeOrganizationId } = context.session;
    if (!activeOrganizationId) {
      return null;
    }
    const organization = await context.db.query.organization.findFirst({
      where: (table, { eq }) => eq(table.id, activeOrganizationId),
    });
    return organization ?? null;
  });

export default protectedBase.prefix("/organization").router({ active });
