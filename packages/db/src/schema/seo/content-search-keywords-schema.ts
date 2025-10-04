import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import type { serpPositionSchema } from "../../schema-parsers";
import { timestamps } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContent } from "./content-schema";
import { seoSearchKeyword } from "./search-keyword-schema";

export const seoContentSearchKeyword = pgSeoTable(
  "content_search_keyword",
  {
    contentId: uuid()
      .notNull()
      .references(() => seoContent.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    searchKeywordId: uuid()
      .notNull()
      .references(() => seoSearchKeyword.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text({ enum: ["primary", "secondary"] }).notNull(),
    serpDetail: jsonb().$type<{
      current: typeof serpPositionSchema.infer & { date: string };
      history: (typeof serpPositionSchema.infer & { date: string })[];
    }>(),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.contentId, table.searchKeywordId] }),
    index("seo_content_search_keyword_content_idx").on(table.contentId),
    index("seo_content_search_keyword_search_keyword_idx").on(
      table.searchKeywordId,
    ),
    index("seo_content_search_keyword_type_idx").on(table.type),
  ],
);

export const seoContentSearchKeywordRelations = relations(
  seoContentSearchKeyword,
  ({ one }) => ({
    content: one(seoContent, {
      fields: [seoContentSearchKeyword.contentId],
      references: [seoContent.id],
    }),
    searchKeyword: one(seoSearchKeyword, {
      fields: [seoContentSearchKeyword.searchKeywordId],
      references: [seoSearchKeyword.id],
    }),
  }),
);

export const seoContentSearchKeywordInsertSchema = createInsertSchema(
  seoContentSearchKeyword,
).omit("createdAt", "updatedAt");
export const seoContentSearchKeywordSelectSchema = createSelectSchema(
  seoContentSearchKeyword,
);
export const seoContentSearchKeywordUpdateSchema = createUpdateSchema(
  seoContentSearchKeyword,
)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      contentId: "string.uuid",
      searchKeywordId: "string.uuid",
    }),
  );
