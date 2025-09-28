import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoContentCampaignCluster } from "./content-campaign-cluster-schema";
import { seoProject } from "./project-schema";

export const seoContentCampaign = pgSeoTable(
  "content_campaign",
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
    keywordCategory: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_content_campaign_organization_idx").on(table.organizationId),
    index("seo_content_campaign_project_idx").on(table.projectId),
  ],
);

export const seoContentCampaignRelations = relations(
  seoContentCampaign,
  ({ one, many }) => ({
    project: one(seoProject, {
      fields: [seoContentCampaign.projectId],
      references: [seoProject.id],
    }),
    organization: one(organization, {
      fields: [seoContentCampaign.organizationId],
      references: [organization.id],
    }),
    clusters: many(seoContentCampaignCluster),
  }),
);

export const seoContentCampaignInsertSchema = createInsertSchema(
  seoContentCampaign,
).omit("id", "createdAt", "updatedAt");
export const seoContentCampaignSelectSchema =
  createSelectSchema(seoContentCampaign);
export const seoContentCampaignUpdateSchema = createUpdateSchema(
  seoContentCampaign,
)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
