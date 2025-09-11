import { ORPCError } from "@orpc/client";
import { and, desc, eq, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";
import { getProjectById } from "../lib/project";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      keywordId: "string|undefined",
      limit: "1<=number<=100|undefined",
    }),
  )
  .output(schema.mentionSelectSchema.array())
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

    const rows = await context.db.query.smMention.findMany({
      where: input.keywordId
        ? and(
            eq(schema.smMention.projectId, input.projectId),
            eq(schema.smMention.keywordId, input.keywordId),
          )
        : eq(schema.smMention.projectId, input.projectId),
      orderBy: desc(schema.smMention.createdAt),
      limit: input.limit ?? 50,
    });
    return rows;
  });

export default protectedBase.prefix("/mentions").router({ list });
