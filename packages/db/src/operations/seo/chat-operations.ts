import {
  CHAT_DEFAULT_STATUS,
  CHAT_DEFAULT_TITLE,
} from "@rectangular-labs/core/schemas/chat-parser";
import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, isNull, schema } from "../../client";

export async function createChat(
  db: DB,
  values: typeof schema.seoChat.$inferInsert,
) {
  const result = await safe(() =>
    db.insert(schema.seoChat).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const chat = result.value[0];
  if (!chat) {
    return err(new Error("Failed to create chat"));
  }
  return ok(chat);
}

export async function getDefaultChat({
  db,
  projectId,
  organizationId,
  userId,
}: {
  db: DB;
  projectId: string;
  organizationId: string;
  userId: string;
}) {
  const existingChatResult = await safe(() =>
    db.query.seoChat.findFirst({
      where: (table, { eq, and, isNull }) =>
        and(
          eq(table.projectId, projectId),
          eq(table.organizationId, organizationId),
          isNull(table.deletedAt),
          eq(table.status, CHAT_DEFAULT_STATUS),
          eq(table.title, CHAT_DEFAULT_TITLE),
          eq(table.createdByUserId, userId),
        ),
    }),
  );

  return existingChatResult;
}

export async function getChatById({
  db,
  id,
  projectId,
  organizationId,
}: {
  db: DB;
  id: string;
  projectId: string;
  organizationId: string;
}) {
  return await safe(() =>
    db.query.seoChat.findFirst({
      where: (table, { eq, and, isNull }) =>
        and(
          eq(table.id, id),
          eq(table.projectId, projectId),
          eq(table.organizationId, organizationId),
          isNull(table.deletedAt),
        ),
    }),
  );
}

export async function updateChat({
  db,
  values,
}: {
  db: DB;
  values: typeof schema.seoChatUpdateSchema.infer;
}) {
  const result = await safe(() =>
    db
      .update(schema.seoChat)
      .set(values)
      .where(
        and(
          eq(schema.seoChat.id, values.id),
          eq(schema.seoChat.projectId, values.projectId),
          eq(schema.seoChat.organizationId, values.organizationId),
          isNull(schema.seoChat.deletedAt),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }

  return ok(result.value[0]);
}

export async function deleteChat({
  db,
  id,
  projectId,
  organizationId,
}: {
  db: DB;
  id: string;
  projectId: string;
  organizationId: string;
}) {
  const result = await safe(() =>
    db
      .update(schema.seoChat)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(schema.seoChat.id, id),
          eq(schema.seoChat.projectId, projectId),
          eq(schema.seoChat.organizationId, organizationId),
          isNull(schema.seoChat.deletedAt),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value[0]);
}
