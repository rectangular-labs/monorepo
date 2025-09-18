import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { base } from "../context";

const create = base
  .route({ method: "POST", path: "/" })
  .input(schema.keywordInsertSchema.merge(type({ projectId: "string" })))
  .output(ProjectKeywordSelectSchema)
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

    const keyword = await context.db.transaction(async (tx) => {
      const keywordResult = await upsertKeyword(input.phrase, tx);
      if (!keywordResult.ok) {
        throw new ORPCError("BAD_REQUEST", {
          message: keywordResult.error.message,
        });
      }
      const keyword = keywordResult.value;

      const [projectKeyword] = await tx
        .insert(schema.smProjectKeyword)
        .values({
          projectId: input.projectId,
          keywordId: keyword.id,
          isPaused: false,
          pollingIntervalSec: 900,
          nextRunAt: new Date(),
          lastRunAt: null,
        })
        .returning();
      if (!projectKeyword) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "No project keyword created.",
        });
      }
      return { phrase: keyword.phrase, ...projectKeyword };
    });

    return keyword;
  });

export default base.prefix("/task").router({ create });
