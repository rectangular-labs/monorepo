import { Buffer } from "node:buffer";
import { ORPCError } from "@orpc/client";
import { and, desc, eq, lt, or, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { protectedBase } from "../context";
import { upsertKeyword } from "../lib/database/keywords";
import { getProjectById } from "../lib/database/project";

const ProjectKeywordSelectSchema = schema.projectKeywordSelectSchema.merge(
  schema.keywordSelectSchema.pick("phrase"),
);

const cursorSchema = type("string.base64")
  .pipe.try(
    (cursor) => Buffer.from(cursor, "base64").toString("utf8"),
    type("string.json.parse"),
    type({
      createdAt: "string.date",
      keywordId: "string.uuid",
    }),
  )
  .or(type("undefined"))
  .optional();

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      limit: "1<=number<=100 = 20",
      cursor: cursorSchema,
    }),
  )
  .output(
    type({
      data: ProjectKeywordSelectSchema.array(),
      nextPageCursor: "string.base64|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const { session } = context.session;
    if (!session.activeOrganizationId) {
      throw new ORPCError("BAD_REQUEST", { message: "Organization not found" });
    }
    const { cursor, projectId } = input;

    const project = await getProjectById(
      projectId,
      session.activeOrganizationId,
    );
    if (!project.ok)
      throw new ORPCError("BAD_REQUEST", {
        message: project.error.message,
      });

    const cursorPredicate = cursor
      ? or(
          lt(schema.smProjectKeyword.createdAt, new Date(cursor.createdAt)),
          and(
            eq(schema.smProjectKeyword.createdAt, new Date(cursor.createdAt)),
            lt(schema.smProjectKeyword.keywordId, cursor.keywordId),
          ),
        )
      : undefined;

    const rows = await context.db.query.smProjectKeyword.findMany({
      where: and(
        eq(schema.smProjectKeyword.projectId, input.projectId),
        cursorPredicate,
      ),
      orderBy: [
        desc(schema.smProjectKeyword.createdAt),
        desc(schema.smProjectKeyword.keywordId),
      ],
      limit: input.limit + 1,
      with: {
        keyword: true,
      },
    });

    const data = rows.slice(0, input.limit).map((row) => ({
      ...row,
      phrase: row.keyword.phrase,
    }));
    const hasMore = rows.length > input.limit;
    const last = data.at(-1);
    const nextPageCursor =
      hasMore && last
        ? Buffer.from(
            JSON.stringify({
              createdAt: last.createdAt.toISOString(),
              keywordId: last.keywordId,
            }),
          ).toString("base64")
        : undefined;

    return { data, nextPageCursor };
  });

const create = protectedBase
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

const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      id: "string",
      projectId: "string",
      data: schema.keywordUpdateSchema,
    }),
  )
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

    const projectKeyword = await context.db.transaction(async (tx) => {
      const keywordResult = await upsertKeyword(input.data.phrase ?? "", tx);
      if (!keywordResult.ok) {
        throw new ORPCError("BAD_REQUEST", {
          message: keywordResult.error.message,
        });
      }
      const keyword = keywordResult.value;
      const [updateProjectKeyword] = await tx
        .update(schema.smProjectKeyword)
        .set({
          ...input.data,
          keywordId: keyword.id,
        })
        .where(
          and(
            eq(schema.smProjectKeyword.projectId, input.projectId),
            eq(schema.smProjectKeyword.keywordId, input.id),
          ),
        )
        .returning();
      if (!updateProjectKeyword) {
        throw new ORPCError("BAD_REQUEST", {
          message: "No project keyword found to update.",
        });
      }
      return {
        phrase: keyword.phrase,
        ...updateProjectKeyword,
      };
    });

    return projectKeyword;
  });

const remove = protectedBase
  .route({ method: "DELETE", path: "/{keywordId}" })
  .input(type({ keywordId: "string", projectId: "string" }))
  .output(type({ success: "true" }))
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

    const [deletedProjectKeyword] = await context.db
      .delete(schema.smProjectKeyword)
      .where(
        and(
          eq(schema.smProjectKeyword.keywordId, input.keywordId),
          eq(schema.smProjectKeyword.projectId, input.projectId),
        ),
      );
    if (!deletedProjectKeyword) {
      throw new ORPCError("BAD_REQUEST", {
        message: "No project keyword found to delete.",
      });
    }
    return { success: true } as const;
  });

export default protectedBase
  .prefix("/keywords")
  .router({ list, create, update, remove });
