import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentCampaign } from "./content-campaign-schema";

export const seoArticle = pgSeoTable(
  "article",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    contentCampaignId: uuid()
      .notNull()
      .references(() => seoContentCampaign.id, {
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
    index("seo_article_content_campaign_idx").on(table.contentCampaignId),
    index("seo_article_status_idx").on(table.status),
  ],
);

export const seoArticleRelations = relations(seoArticle, ({ one }) => ({
  contentCampaign: one(seoContentCampaign, {
    fields: [seoArticle.contentCampaignId],
    references: [seoContentCampaign.id],
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
