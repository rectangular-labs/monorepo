import type { UIMessage } from "ai";
import { createInsertSchema, createSelectSchema } from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoContentCampaign } from "./content-campaign-schema";
import { seoProject } from "./project-schema";

export const seoContentCampaignMessage = pgSeoTable(
  "content_campaign_message",
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
    campaignId: uuid()
      .notNull()
      .references(() => seoContentCampaign.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    source: text({
      enum: ["user", "assistant", "system"],
    }).notNull(),
    userId: text().references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    message: jsonb().$type<UIMessage["parts"]>().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_content_campaign_message_org_project_campaign_id_idx").on(
      table.organizationId,
      table.projectId,
      table.campaignId,
      table.id,
    ),
  ],
);

export const seoContentCampaignMessageRelations = relations(
  seoContentCampaignMessage,
  ({ one }) => ({
    campaign: one(seoContentCampaign, {
      fields: [seoContentCampaignMessage.campaignId],
      references: [seoContentCampaign.id],
    }),
  }),
);

export const seoContentCampaignMessageInsertSchema = createInsertSchema(
  seoContentCampaignMessage,
).omit("createdAt", "updatedAt");
export const seoContentCampaignMessageSelectSchema = createSelectSchema(
  seoContentCampaignMessage,
);
