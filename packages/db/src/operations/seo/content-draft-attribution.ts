import { safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";

/**
 * Record that a chat contributed to a draft.
 */
export async function addChatContribution(args: {
  db: DB;
  draftId: string;
  chatId: string;
}) {
  return await safe(() =>
    args.db
      .insert(schema.seoContentDraftChat)
      .values({
        draftId: args.draftId,
        chatId: args.chatId,
      })
      .onConflictDoNothing()
      .returning(),
  );
}

/**
 * Record that a user contributed to a draft.
 */
export async function addUserContribution(args: {
  db: DB;
  draftId: string;
  userId: string;
}) {
  return await safe(() =>
    args.db
      .insert(schema.seoContentDraftUser)
      .values({
        draftId: args.draftId,
        userId: args.userId,
      })
      .onConflictDoNothing()
      .returning(),
  );
}

/**
 * Get all chats that contributed to a draf t.
 */
export async function getDraftContributingChats(args: {
  db: DB;
  draftId: string;
}) {
  return await safe(() =>
    args.db.query.seoContentDraftChat.findMany({
      where: (table, { eq }) => eq(table.draftId, args.draftId),
      with: {
        chat: true,
      },
      orderBy: (fields, { desc }) => [desc(fields.contributedAt)],
    }),
  );
}

/**
 * Get all users that contributed to a draft.
 */
export async function getDraftContributors(args: { db: DB; draftId: string }) {
  return await safe(() =>
    args.db.query.seoContentDraftUser.findMany({
      where: (table, { eq }) => eq(table.draftId, args.draftId),
      with: {
        user: true,
      },
      orderBy: (fields, { desc }) => [desc(fields.contributedAt)],
    }),
  );
}
