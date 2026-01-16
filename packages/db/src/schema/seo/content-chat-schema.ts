import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, primaryKey, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgSeoTable } from "../_table";
import { seoChat } from "./chat-schema";
import { seoContent } from "./content-schema";

/**
 * Tracks which chats contributed to published content.
 * Append-only for attribution/audit purposes.
 */
export const seoContentChat = pgSeoTable(
  "content_chat",
  {
    contentId: uuid()
      .notNull()
      .references(() => seoContent.id, {
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
    primaryKey({ columns: [table.contentId, table.chatId] }),
    index("seo_content_chat_content_idx").on(table.contentId),
    index("seo_content_chat_chat_idx").on(table.chatId),
  ],
);

export const seoContentChatRelations = relations(seoContentChat, ({ one }) => ({
  content: one(seoContent, {
    fields: [seoContentChat.contentId],
    references: [seoContent.id],
  }),
  chat: one(seoChat, {
    fields: [seoContentChat.chatId],
    references: [seoChat.id],
  }),
}));

export const seoContentChatInsertSchema = createInsertSchema(seoContentChat);
export const seoContentChatSelectSchema = createSelectSchema(seoContentChat);
