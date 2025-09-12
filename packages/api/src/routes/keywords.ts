import { ORPCError } from "@orpc/client";
import { and, desc, eq, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";
import { getProjectById } from "../lib/project";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(type({ projectId: "string" }))
  .output(schema.keywordSelectSchema.array())
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }

    const project = await getProjectById(
      input.projectId,
      session.activeOrganizationId,
    );
    if (!project.ok)
      throw new ORPCError("BAD_REQUEST", {
        message: project.error.message,
      });

    const rows = await context.db.query.smKeyword.findMany({
      where: eq(schema.smKeyword.projectId, input.projectId),
      orderBy: desc(schema.smKeyword.createdAt),
    });
    return rows;
  });

const create = protectedBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.keywordInsertSchema.omit(
      "createdAt",
      "updatedAt",
      "nextRunAt",
      "lastRunAt",
      "id",
    ),
  )
  .output(schema.keywordSelectSchema)
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }

    const project = await getProjectById(
      input.projectId,
      session.activeOrganizationId,
    );
    if (!project.ok)
      throw new ORPCError("BAD_REQUEST", { message: project.error.message });

    const [row] = await context.db
      .insert(schema.smKeyword)
      .values({ projectId: input.projectId, phrase: input.phrase })
      .returning();
    if (!row) throw new Error("Keyword not created");
    return row;
  });

const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    schema.keywordUpdateSchema
      .omit("createdAt", "updatedAt", "nextRunAt", "lastRunAt")
      .merge(type({ id: "string", projectId: "string" })),
  )
  .output(schema.keywordSelectSchema)
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const project = await getProjectById(
      input.projectId,
      session.activeOrganizationId,
    );
    if (!project.ok)
      throw new ORPCError("BAD_REQUEST", { message: project.error.message });

    const [row] = await context.db
      .update(schema.smKeyword)
      .set(input)
      .where(eq(schema.smKeyword.id, input.id))
      .returning();
    if (!row) throw new Error("Keyword not found");
    return row;
  });

const remove = protectedBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", projectId: "string" }))
  .output(type({ success: "boolean" }))
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }

    const project = await context.db.query.smProject.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.id, input.projectId),
          eq(table.organizationId, session.activeOrganizationId ?? ""),
        ),
    });
    if (!project) throw new Error("Project not found");

    await context.db
      .delete(schema.smKeyword)
      .where(
        and(
          eq(schema.smKeyword.id, input.id),
          eq(schema.smKeyword.projectId, input.projectId),
        ),
      );
    return { success: true } as const;
  });

export default protectedBase
  .prefix("/keywords")
  .router({ list, create, update, remove });
