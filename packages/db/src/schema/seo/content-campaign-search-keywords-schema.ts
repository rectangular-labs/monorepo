import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, primaryKey, text, uuid } from "drizzle-orm/pg-core";
import { timestamps } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentCampaign } from "./content-campaign-schema";
import { seoSearchKeyword } from "./search-keyword-schema";

export const seoContentCampaignSearchKeyword = pgSeoTable(
  "content_campaign_search_keyword",
  {
    contentCampaignId: uuid()
      .notNull()
      .references(() => seoContentCampaign.id, {
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
    rankingDetail: jsonb()
      .$type<{
        current: { position: number; domain: string; date: string } | undefined;
        history: { position: number; domain: string; date: string }[];
      }>()
      .$defaultFn(() => ({ current: undefined, history: [] })),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.contentCampaignId, table.searchKeywordId] }),
    index("seo_content_campaign_search_keyword_content_campaign_idx").on(
      table.contentCampaignId,
    ),
    index("seo_content_campaign_search_keyword_search_keyword_idx").on(
      table.searchKeywordId,
    ),
    index("seo_content_campaign_search_keyword_type_idx").on(table.type),
  ],
);

export const seoContentCampaignSearchKeywordRelations = relations(
  seoContentCampaignSearchKeyword,
  ({ one }) => ({
    contentCampaign: one(seoContentCampaign, {
      fields: [seoContentCampaignSearchKeyword.contentCampaignId],
      references: [seoContentCampaign.id],
    }),
    searchKeyword: one(seoSearchKeyword, {
      fields: [seoContentCampaignSearchKeyword.searchKeywordId],
      references: [seoSearchKeyword.id],
    }),
  }),
);

export const seoContentCampaignSearchKeywordInsertSchema = createInsertSchema(
  seoContentCampaignSearchKeyword,
).omit("createdAt", "updatedAt");
export const seoContentCampaignSearchKeywordSelectSchema = createSelectSchema(
  seoContentCampaignSearchKeyword,
);
export const seoContentCampaignSearchKeywordUpdateSchema = createUpdateSchema(
  seoContentCampaignSearchKeyword,
)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      contentCampaignId: "string.uuid",
      searchKeywordId: "string.uuid",
    }),
  );
