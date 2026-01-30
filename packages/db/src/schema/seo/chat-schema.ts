import {
  CHAT_DEFAULT_STATUS,
  CHAT_DEFAULT_TITLE,
} from "@rectangular-labs/core/schemas/chat-parser";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations, sql } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoChatMessage } from "./chat-message-schema";
import { seoContentDraftChat } from "./content-draft-chat-schema";
import { seoProject } from "./project-schema";

const chatStatuses = ["idle", "working"] as const;

export const seoChat = pgSeoTable(
  "chat",
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
    createdByUserId: text().references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    title: text().notNull().default(CHAT_DEFAULT_TITLE),
    status: text({
      enum: chatStatuses,
    })
      .notNull()
      .default(CHAT_DEFAULT_STATUS),
    ...timestamps,
  },
  (table) => [
    index("seo_chat_org_idx").on(table.organizationId),
    index("seo_chat_project_idx").on(table.projectId),
    index("seo_chat_created_by_user_idx").on(table.createdByUserId),
    index("seo_chat_status_idx").on(table.status),
    index("seo_chat_deleted_at_idx").on(table.deletedAt),
    index("seo_chat_title_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.title})`,
    ),
  ],
);

export const seoChatRelations = relations(seoChat, ({ one, many }) => ({
  project: one(seoProject, {
    fields: [seoChat.projectId],
    references: [seoProject.id],
  }),
  organization: one(organization, {
    fields: [seoChat.organizationId],
    references: [organization.id],
  }),
  createdByUser: one(user, {
    fields: [seoChat.createdByUserId],
    references: [user.id],
  }),
  messages: many(seoChatMessage),
  contentDraftMap: many(seoContentDraftChat),
}));

export const seoChatInsertSchema = createInsertSchema(seoChat).omit(
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
  "organizationId",
);
export const seoChatSelectSchema = createSelectSchema(seoChat);
export const seoChatUpdateSchema = createUpdateSchema(seoChat)
  .omit("createdAt", "updatedAt", "createdByUserId", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
    }),
  );
