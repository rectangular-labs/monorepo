import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, integer, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { intentSchema } from "../../schema-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentCampaignSearchKeyword } from "./content-campaign-search-keywords-schema";

export const seoSearchKeyword = pgSeoTable(
  "search_keyword",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    normalizedPhrase: text().notNull().unique(),
    searchVolume: integer().notNull(),
    keywordDifficulty: integer().notNull(),
    cpc: integer().notNull().default(0),
    intent: text({
      enum: [
        "transactional",
        "informational",
        "navigational",
        "commercial",
      ] as (typeof intentSchema.infer)[] as [string, ...string[]],
    }).notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_search_keyword_normalized_phrase_unique").on(
      table.normalizedPhrase,
    ),
    index("seo_search_keyword_search_volume_idx").on(table.searchVolume),
    index("seo_search_keyword_keyword_difficulty_idx").on(
      table.keywordDifficulty,
    ),
    index("seo_search_keyword_cpc_idx").on(table.cpc),
    index("seo_search_keyword_intent_idx").on(table.intent),
  ],
);

export const seoSearchKeywordRelations = relations(
  seoSearchKeyword,
  ({ many }) => ({
    contentCampaignsMap: many(seoContentCampaignSearchKeyword),
  }),
);

export const seoSearchKeywordInsertSchema = createInsertSchema(
  seoSearchKeyword,
).omit("id", "createdAt", "updatedAt");
export const seoSearchKeywordSelectSchema =
  createSelectSchema(seoSearchKeyword);
export const seoSearchKeywordUpdateSchema = createUpdateSchema(
  seoSearchKeyword,
).omit("createdAt", "updatedAt");
