import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgSeoTable } from "../_table";
import { seoChat } from "./chat-schema";
import { seoContentDraft } from "./content-draft-schema";

/**
 * Tracks which chats contributed to a draft.
 * Append-only for attribution/audit purposes.
 */
export const seoContentDraftChat = pgSeoTable(
  "content_draft_chat",
  {
    draftId: uuid()
      .notNull()
      .references(() => seoContentDraft.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    chatId: uuid()
      .notNull()
      .references(() => seoChat.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    contributedAt: timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.draftId, table.chatId] }),
    index("seo_content_draft_chat_draft_idx").on(table.draftId),
    index("seo_content_draft_chat_chat_idx").on(table.chatId),
  ],
);

export const seoContentDraftChatRelations = relations(
  seoContentDraftChat,
  ({ one }) => ({
    draft: one(seoContentDraft, {
      fields: [seoContentDraftChat.draftId],
      references: [seoContentDraft.id],
    }),
    chat: one(seoChat, {
      fields: [seoContentDraftChat.chatId],
      references: [seoChat.id],
    }),
  }),
);

export const seoContentDraftChatInsertSchema =
  createInsertSchema(seoContentDraftChat);
export const seoContentDraftChatSelectSchema =
  createSelectSchema(seoContentDraftChat);
