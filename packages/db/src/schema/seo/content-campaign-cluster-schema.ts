import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, integer, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoArticle } from "./article-schema";
import { seoContentCampaign } from "./content-campaign-schema";

export const seoContentCampaignCluster = pgSeoTable(
  "content_campaign_cluster",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    campaignId: uuid()
      .notNull()
      .references(() => seoContentCampaign.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    primaryKeyword: text().notNull(),
    secondaryKeywords: text().array().notNull().default([]),
    order: integer().notNull(),
    // TODO: insert keyword data here.
    // TODO: insert serp snapshot data here.
    // serpSnapshot: jsonb().$type<{
    //   provider: "jina.ai",
    //   topN: number,
    //   fetchedAt: string,
    //   costInUsdCents: number,
    //   results: {
    //     url: string,
    //     title: string,
    //     description: string,
    //   }[],
    // }>(),
    ...timestamps,
  },
  (table) => [
    index("seo_campaign_cluster_campaign_idx").on(table.campaignId),
    index("seo_campaign_cluster_keyword_idx").on(table.primaryKeyword),
  ],
);

export const seoContentCampaignClusterRelations = relations(
  seoContentCampaignCluster,
  ({ one, many }) => ({
    campaign: one(seoContentCampaign, {
      fields: [seoContentCampaignCluster.campaignId],
      references: [seoContentCampaign.id],
    }),
    articles: many(seoArticle),
  }),
);

export const seoContentCampaignClusterInsertSchema = createInsertSchema(
  seoContentCampaignCluster,
).omit("id", "createdAt", "updatedAt");
export const seoContentCampaignClusterSelectSchema = createSelectSchema(
  seoContentCampaignCluster,
);
export const seoContentCampaignClusterUpdateSchema = createUpdateSchema(
  seoContentCampaignCluster,
)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
