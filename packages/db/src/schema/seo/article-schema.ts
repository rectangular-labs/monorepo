import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentCampaignCluster } from "./content-campaign-cluster-schema";

export const seoArticle = pgSeoTable(
  "article",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    campaignClusterId: uuid()
      .notNull()
      .references(() => seoContentCampaignCluster.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    title: text(),
    draftMarkdown: text(),
    targetUrlSlug: text(),
    status: text({ enum: ["draft", "published"] })
      .notNull()
      .default("draft"),
    ...timestamps,
  },
  (table) => [
    index("seo_article_campaign_cluster_idx").on(table.campaignClusterId),
    index("seo_article_status_idx").on(table.status),
  ],
);

export const seoArticleRelations = relations(seoArticle, ({ one }) => ({
  campaignCluster: one(seoContentCampaignCluster, {
    fields: [seoArticle.campaignClusterId],
    references: [seoContentCampaignCluster.id],
  }),
}));

export const seoArticleInsertSchema = createInsertSchema(seoArticle).omit(
  "id",
  "createdAt",
  "updatedAt",
);
export const seoArticleSelectSchema = createSelectSchema(seoArticle);
export const seoArticleUpdateSchema = createUpdateSchema(seoArticle).omit(
  "createdAt",
  "updatedAt",
);
