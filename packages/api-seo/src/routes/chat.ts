import { ORPCError, type as orpcType } from "@orpc/server";
import { chatMessageMetadataSchema } from "@rectangular-labs/core/schemas/chat-message-parser";
import {
  CHAT_DEFAULT_TITLE,
  chatStatusSchema,
} from "@rectangular-labs/core/schemas/chat-parser";
import { schema, sql } from "@rectangular-labs/db";
import {
  createChat,
  deleteChat,
  getChatById,
  getDefaultChat,
  listChatMessages,
  updateChat,
} from "@rectangular-labs/db/operations";
import { validateUIMessages } from "ai";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type { SeoChatMessage } from "../types";
import { sendMessage } from "./chat.sendMessage";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationId: "string",
      projectId: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
      "status?": chatStatusSchema,
      "search?": "string|undefined",
    }),
  )
  .output(
    type({
      data: schema.seoChatSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const chats = await context.db.query.seoChat.findMany({
      where: (table, { eq, and, ne, lt }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, input.organizationId),
          ne(table.title, CHAT_DEFAULT_TITLE),
          input.cursor ? lt(table.id, input.cursor) : undefined,
          input.status ? eq(table.status, input.status) : undefined,
          // https://orm.drizzle.team/docs/guides/postgresql-full-text-search
          input.search
            ? sql`to_tsvector('english', ${table.title}) @@ websearch_to_tsquery('english', ${input.search})`
            : undefined,
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: input.limit + 1,
    });
    const data = chats.slice(0, input.limit);
    const nextPageCursor =
      chats.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const get = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}" })
  .input(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .output(type({ chat: schema.seoChatSelectSchema }))
  .handler(async ({ context, input }) => {
    const chatResult = await getChatById({
      db: context.db,
      id: input.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!chatResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to load chat",
        cause: chatResult.error,
      });
    }
    if (!chatResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
    }
    return { chat: chatResult.value };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(schema.seoChatInsertSchema.merge(type({ organizationId: "string" })))
  .output(schema.seoChatSelectSchema)
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const existingDefaultChatResult = await getDefaultChat({
      db: context.db,
      projectId: input.projectId,
      organizationId: context.session.activeOrganizationId,
      userId: context.user.id,
    });
    if (!existingDefaultChatResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get default chat",
        cause: existingDefaultChatResult.error,
      });
    }
    if (existingDefaultChatResult.value) {
      return existingDefaultChatResult.value;
    }

    const createChatResult = await createChat(context.db, {
      projectId: input.projectId,
      organizationId: context.organization.id,
      createdByUserId: context.user.id,
    });
    if (!createChatResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create chat",
        cause: createChatResult.error,
      });
    }

    return createChatResult.value;
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(schema.seoChatUpdateSchema.merge(type({ organizationId: "string" })))
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .output(schema.seoChatSelectSchema)
  .handler(async ({ context, input }) => {
    if (input.title === CHAT_DEFAULT_TITLE) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Title cannot be the default title",
      });
    }
    if (!input.title && !input.status) {
      throw new ORPCError("BAD_REQUEST", {
        message: "At least one field must be provided",
      });
    }
    const updateChatResult = await updateChat({
      db: context.db,
      values: {
        id: input.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        title: input.title,
        status: input.status,
      },
    });
    if (!updateChatResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update chat",
        cause: updateChatResult.error,
      });
    }
    if (!updateChatResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
    }
    return updateChatResult.value;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string.uuid", projectId: "string.uuid" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const deleteChatResult = await deleteChat({
      db: context.db,
      id: input.id,
      projectId: input.projectId,
      organizationId: context.session.activeOrganizationId,
    });
    if (!deleteChatResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete chat",
        cause: deleteChatResult.error,
      });
    }
    if (!deleteChatResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Chat not found" });
    }
    return { success: true } as const;
  });

const messages = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}/messages" })
  .input(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
      limit: "1<=number<=100 = 10",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .output(
    orpcType<{ data: SeoChatMessage[]; nextPageCursor: string | undefined }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const result = await listChatMessages({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      chatId: input.id,
      limit: input.limit,
      cursor: input.cursor,
    });
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to list chat messages",
        cause: result.error,
      });
    }
    const { data, nextPageCursor } = result.value;

    if (data.length === 0) {
      return { data: [], nextPageCursor };
    }
    // todo: maybe not validate / cache validation
    const uiMessageSchema = await validateUIMessages<SeoChatMessage>({
      messages: data
        .map((row) => {
          if (row.message.length === 0) {
            return null;
          }
          return {
            id: row.id,
            role: row.source,
            parts: row.message,
            metadata: {
              sentAt: row.createdAt.toISOString(),
              userId: row.userId,
              chatId: input.id,
            },
          };
        })
        .filter((message) => message !== null),
      metadataSchema: chatMessageMetadataSchema,
    });
    return { data: uiMessageSchema, nextPageCursor };
  });

export default withOrganizationIdBase
  .prefix("/organization/{organizationId}/project/{projectId}/chat")
  .router({ list, get, create, update, remove, messages, sendMessage });
