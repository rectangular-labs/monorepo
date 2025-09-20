import { ORPCError } from "@orpc/client";
import { and, desc, eq, lt, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase, withOrganizationIdBase } from "../context";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .output(
    type({
      data: schema.seoProjectSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rows = await context.db.query.seoProject.findMany({
      where: and(
        eq(
          schema.seoProject.organizationId,
          context.session.activeOrganizationId,
        ),
        input.cursor ? lt(schema.seoProject.id, input.cursor) : undefined,
      ),
      orderBy: desc(schema.seoProject.id),
      limit: input.limit + 1,
    });
    const data = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.seoProjectInsertSchema.omit(
      "id",
      "createdAt",
      "updatedAt",
      "organizationId",
    ),
  )
  .output(schema.seoProjectSelectSchema)
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .insert(schema.seoProject)
      .values({
        organizationId: context.session.activeOrganizationId,
        websiteUrl: input.websiteUrl,
      })
      .returning();
    if (!row) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "No project created.",
      });
    }
    return row;
  });
const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      id: "string",
      data: schema.seoProjectUpdateSchema.omit(
        "id",
        "createdAt",
        "updatedAt",
        "organizationId",
      ),
    }),
  )
  .output(schema.seoProjectSelectSchema)
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .update(schema.seoProject)
      .set(input.data)
      .where(
        and(
          eq(schema.seoProject.id, input.id),
          eq(
            schema.seoProject.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to update.",
      });
    }
    return row;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .delete(schema.seoProject)
      .where(
        and(
          eq(schema.seoProject.id, input.id),
          eq(
            schema.seoProject.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to delete.",
      });
    }
    return { success: true } as const;
  });

export default protectedBase
  .prefix("/project")
  .router({ list, create, update, remove });
