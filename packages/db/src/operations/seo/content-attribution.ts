import { ok, safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";

/**
 * Record that a chat contributed to published content.
 */
export async function addContentChatContribution(args: {
  db: DB;
  contentId: string;
  chatIds: string[];
}) {
  if (args.chatIds.length === 0) {
    return ok([]);
  }
  return await safe(() =>
    args.db
      .insert(schema.seoContentChat)
      .values(
        args.chatIds.map((chatId) => ({ contentId: args.contentId, chatId })),
      )
      .onConflictDoNothing()
      .returning(),
  );
}

/**
 * Record that a user contributed to published content.
 */
export async function addContentUserContribution(args: {
  db: DB;
  contentId: string;
  userIds: string[];
}) {
  if (args.userIds.length === 0) {
    return ok([]);
  }
  return await safe(() =>
    args.db
      .insert(schema.seoContentUser)
      .values(
        args.userIds.map((userId) => ({
          contentId: args.contentId,
          userId,
        })),
      )
      .onConflictDoNothing()
      .returning(),
  );
}

/**
 * Get all chats that contributed to published content.
 */
export async function getContentContributingChats(args: {
  db: DB;
  contentId: string;
}) {
  return await safe(() =>
    args.db.query.seoContentChat.findMany({
      where: (table, { eq }) => eq(table.contentId, args.contentId),
      with: {
        chat: true,
      },
      orderBy: (fields, { desc }) => [desc(fields.contributedAt)],
    }),
  );
}

/**
 * Get all users that contributed to published content.
 */
export async function getContentContributors(args: {
  db: DB;
  contentId: string;
}) {
  return await safe(() =>
    args.db.query.seoContentUser.findMany({
      where: (table, { eq }) => eq(table.contentId, args.contentId),
      with: {
        user: true,
      },
      orderBy: (fields, { desc }) => [desc(fields.contributedAt)],
    }),
  );
}
