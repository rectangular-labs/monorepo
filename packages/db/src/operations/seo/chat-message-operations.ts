import { err, ok, safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";
import type { seoChatMessageInsertSchema } from "../../schema/seo";

export async function createChatMessage({
  db,
  value,
}: {
  db: DB;
  value: typeof seoChatMessageInsertSchema.infer;
}) {
  const result = await safe(() =>
    db.insert(schema.seoChatMessage).values(value).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const row = result.value[0];
  if (!row) {
    return err(new Error("Failed to create chat message"));
  }
  return ok(row);
}

export async function getChatMessageById({
  db,
  organizationId,
  projectId,
  chatId,
  id,
}: {
  db: DB;
  organizationId: string;
  projectId: string;
  chatId: string;
  id: string;
}) {
  const result = await safe(() =>
    db.query.seoChatMessage.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.organizationId, organizationId),
          eq(table.projectId, projectId),
          eq(table.chatId, chatId),
          eq(table.id, id),
        ),
    }),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value ?? null);
}

export async function listChatMessages({
  db,
  organizationId,
  projectId,
  chatId,
  limit = 10,
  cursor,
}: {
  db: DB;
  organizationId: string;
  projectId: string;
  chatId: string;
  limit?: number;
  cursor?: string;
}) {
  const result = await safe(() =>
    db.query.seoChatMessage.findMany({
      where: (table, { and, eq, lt }) =>
        and(
          eq(table.organizationId, organizationId),
          eq(table.projectId, projectId),
          eq(table.chatId, chatId),
          cursor ? lt(table.id, cursor) : undefined,
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: limit + 1,
    }),
  );
  if (!result.ok) {
    return result;
  }
  const rows = result.value;
  const data = rows.slice(0, limit);
  const nextPageCursor = rows.length > limit ? data.at(-1)?.id : undefined;
  return ok({ data, nextPageCursor });
}
