import { ORPCError } from "@orpc/client";
import { and, desc, eq, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      limit: "1<=number<=100|undefined",
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
      where: eq(
        schema.smProject.organizationId,
        session.activeOrganizationId ?? "",
      ),
      orderBy: desc(schema.smProject.createdAt),
      limit: input.limit ?? 20,
    });
    return rows;
  });

const create = protectedBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      pollingIntervalSec: "number|undefined",
      autoGenerateReplies: "boolean|undefined",
      isPaused: "boolean|undefined",
      currentReplyPromptId: "string|undefined",
    }),
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
        currentReplyPromptId: input.currentReplyPromptId,
      })
      .returning();
    if (!row) throw new Error("Project not created");
    return row;
  });

const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      id: "string",
      data: type({
        pollingIntervalSec: "number|undefined",
        autoGenerateReplies: "boolean|undefined",
        isPaused: "boolean|undefined",
        currentReplyPromptId: "string|undefined",
      }).partial(),
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
          eq(
            schema.smProject.organizationId,
            session.activeOrganizationId ?? "",
          ),
        ),
      )
      .returning();
    if (!row) throw new Error("Project not found");
    return row;
  });

const remove = protectedBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string" }))
  .output(type({ success: "boolean" }))
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    await context.db
      .delete(schema.smProject)
      .where(
        and(
          eq(schema.smProject.id, input.id),
          eq(
            schema.smProject.organizationId,
            session.activeOrganizationId ?? "",
          ),
        ),
      );
    return { success: true } as const;
  });

export default protectedBase
  .prefix("/projects")
  .router({ list, create, update, remove });
