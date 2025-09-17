import { ORPCError } from "@orpc/client";
import { desc, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";
import { getKeywordIds } from "../lib/database/keywords";
import { getProjectById } from "../lib/database/project";

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      keywordId: "string|undefined",
      limit: "1<=number<=100 = 20",
      "cursor?": "string|undefined",
    }),
  )
  .output(
    type({
      data: schema.projectKeywordMentionSelectSchema
        .merge(type({ mention: schema.mentionSelectSchema }))
        .array(),
      nextPageCursor: "string|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }

    const project = await getProjectById(
      input.projectId,
      session.activeOrganizationId,
    );
    if (!project.ok) {
      throw new ORPCError("BAD_REQUEST", { message: project.error.message });
    }

    const keywordIds = input.keywordId
      ? []
      : await getKeywordIds(input.projectId);

    const rows = await context.db.query.smProjectKeywordMention.findMany({
      where: (table, { eq, and, inArray }) => {
        return and(
          eq(table.projectId, input.projectId),
          input.keywordId
            ? eq(table.keywordId, input.keywordId)
            : inArray(table.keywordId, keywordIds),
        );
      },
      orderBy: desc(schema.smMention.createdAt),
      limit: input.limit,
      with: {
        mention: true,
      },
    });
    return { data: rows, nextPageCursor: undefined };
  });

export default protectedBase
  .prefix("/project/{projectId}/mention")
  .router({ list });
