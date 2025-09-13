import { ORPCError } from "@orpc/client";
import { and, desc, eq, gt, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      limit: "1<=number<=100 = 20",
      cursor: "string|undefined",
    }),
  )
  .output(schema.projectSelectSchema.array())
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const rows = await context.db.query.smProject.findMany({
      where: and(
        eq(schema.smProject.organizationId, session.activeOrganizationId),
        input.cursor ? gt(schema.smProject.id, input.cursor) : undefined,
      ),
      orderBy: desc(schema.smProject.id),
      limit: input.limit,
    });
    return rows;
  });

const create = protectedBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.projectInsertSchema.omit(
      "id",
      "createdAt",
      "updatedAt",
      "organizationId",
      "currentReplyPromptId",
    ),
  )
  .output(schema.projectSelectSchema)
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const [row] = await context.db
      .insert(schema.smProject)
      .values({
        organizationId: session.activeOrganizationId,
        pollingIntervalSec: input.pollingIntervalSec,
        autoGenerateReplies: input.autoGenerateReplies,
        isPaused: input.isPaused,
      })
      .returning();
    if (!row) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "No project created.",
      });
    }
    return row;
  });
const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      id: "string",
      data: schema.projectUpdateSchema.omit(
        "id",
        "createdAt",
        "updatedAt",
        "organizationId",
        "currentReplyPromptId",
      ),
    }),
  )
  .output(schema.projectSelectSchema)
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const [row] = await context.db
      .update(schema.smProject)
      .set(input.data)
      .where(
        and(
          eq(schema.smProject.id, input.id),
          eq(schema.smProject.organizationId, session.activeOrganizationId),
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

const remove = protectedBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const [row] = await context.db
      .delete(schema.smProject)
      .where(
        and(
          eq(schema.smProject.id, input.id),
          eq(schema.smProject.organizationId, session.activeOrganizationId),
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
  .prefix("/projects")
  .router({ list, create, update, remove });
