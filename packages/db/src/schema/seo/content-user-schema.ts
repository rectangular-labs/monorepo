import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, primaryKey, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { pgSeoTable } from "../_table";
import { user } from "../auth-schema";
import { seoContent } from "./content-schema";

/**
 * Tracks which users contributed to published content.
 * Append-only for attribution/audit purposes.
 */
export const seoContentUser = pgSeoTable(
  "content_contributor",
  {
    contentId: uuid()
      .notNull()
      .references(() => seoContent.id, {
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
    primaryKey({ columns: [table.contentId, table.userId] }),
    index("seo_content_contributor_content_idx").on(table.contentId),
    index("seo_content_contributor_user_idx").on(table.userId),
  ],
);

export const seoContentUserRelations = relations(seoContentUser, ({ one }) => ({
  content: one(seoContent, {
    fields: [seoContentUser.contentId],
    references: [seoContent.id],
  }),
  user: one(user, {
    fields: [seoContentUser.userId],
    references: [user.id],
  }),
}));

export const seoContentUserInsertSchema = createInsertSchema(seoContentUser);
export const seoContentUserSelectSchema = createSelectSchema(seoContentUser);
