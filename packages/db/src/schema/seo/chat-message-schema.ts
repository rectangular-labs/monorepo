import type { UIMessage } from "ai";
import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoChat } from "./chat-schema";
import { seoProject } from "./project-schema";

export const seoChatMessage = pgSeoTable(
  "chat_message",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    projectId: uuid()
      .notNull()
      .references(() => seoProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    chatId: uuid()
      .notNull()
      .references(() => seoChat.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    source: text({
      enum: ["user", "assistant", "system"],
    }).notNull(),
    userId: text().references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    message: jsonb().$type<UIMessage["parts"]>().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_chat_message_org_project_chat_id_idx").on(
      table.organizationId,
      table.projectId,
      table.chatId,
      table.id,
    ),
  ],
);

export const seoChatMessageRelations = relations(seoChatMessage, ({ one }) => ({
  chat: one(seoChat, {
    fields: [seoChatMessage.chatId],
    references: [seoChat.id],
  }),
}));

export const seoChatMessageInsertSchema = createInsertSchema(
  seoChatMessage,
).omit("createdAt", "updatedAt");
export const seoChatMessageSelectSchema = createSelectSchema(seoChatMessage);
