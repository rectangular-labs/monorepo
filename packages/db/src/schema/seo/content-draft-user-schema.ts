import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgSeoTable } from "../_table";
import { user } from "../auth-schema";
import { seoContentDraft } from "./content-draft-schema";

export const seoContentDraftUser = pgSeoTable(
  "content_draft_contributor",
  {
    draftId: uuid()
      .notNull()
      .references(() => seoContentDraft.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    userId: text()
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    contributedAt: timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.draftId, table.userId] }),
    index("seo_content_draft_contributor_draft_idx").on(table.draftId),
    index("seo_content_draft_contributor_user_idx").on(table.userId),
  ],
);

export const seoContentDraftUserRelations = relations(
  seoContentDraftUser,
  ({ one }) => ({
    draft: one(seoContentDraft, {
      fields: [seoContentDraftUser.draftId],
      references: [seoContentDraft.id],
    }),
    user: one(user, {
      fields: [seoContentDraftUser.userId],
      references: [user.id],
    }),
  }),
);

export const seoContentDraftUserInsertSchema =
  createInsertSchema(seoContentDraftUser);
export const seoContentDraftUserSelectSchema =
  createSelectSchema(seoContentDraftUser);
