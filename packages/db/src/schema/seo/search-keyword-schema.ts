import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  backlinkInfoSchema,
  intentSchema,
  serpResultSchema,
} from "../../schema-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentSearchKeyword } from "./content-search-keywords-schema";

export const seoSearchKeyword = pgSeoTable(
  "search_keyword",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    normalizedPhrase: text().notNull().unique(),
    keywordDifficulty: integer(),
    location: text().notNull(),
    cpcUsdCents: integer().notNull().default(0),
    searchVolume: integer(),
    intent: text({
      enum: [
        "transactional",
        "informational",
        "navigational",
        "commercial",
      ] as const satisfies (typeof intentSchema.infer)[],
    }).notNull(),
    backlinkInfo: jsonb().$type<typeof backlinkInfoSchema.infer>(),
    serpFeatures: text().array(),
    serpResults: jsonb().$type<(typeof serpResultSchema.infer)[]>().default([]),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("seo_search_keyword_location_normalized_phrase_unique").on(
      table.location,
      table.normalizedPhrase,
    ),
    index("seo_search_keyword_search_volume_idx").on(table.searchVolume),
    index("seo_search_keyword_keyword_difficulty_idx").on(
      table.keywordDifficulty,
    ),
    index("seo_search_keyword_cpc_idx").on(table.cpcUsdCents),
    index("seo_search_keyword_intent_idx").on(table.intent),
  ],
);

export const seoSearchKeywordRelations = relations(
  seoSearchKeyword,
  ({ many }) => ({
    contentCampaignsMap: many(seoContentSearchKeyword),
  }),
);

export const seoSearchKeywordInsertSchema = createInsertSchema(
  seoSearchKeyword,
).omit("id", "createdAt", "updatedAt");
export const seoSearchKeywordSelectSchema =
  createSelectSchema(seoSearchKeyword);
export const seoSearchKeywordUpdateSchema = createUpdateSchema(seoSearchKeyword)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      id: "string.uuid",
    }),
  );
