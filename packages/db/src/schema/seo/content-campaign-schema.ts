import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations, sql } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import {
  CAMPAIGN_DEFAULT_STATUS,
  CAMPAIGN_DEFAULT_TITLE,
  type contentCampaignStatusSchema,
} from "../../schema-parsers/content-campaign-parser";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoContentCampaignMessage } from "./content-campaign-message-schema";
import { seoContentSchedule } from "./content-schedule-schema";
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
    createdByUserId: text()
      .notNull()
      .references(() => user.id, { onDelete: "cascade", onUpdate: "cascade" }),
    title: text().notNull().default(CAMPAIGN_DEFAULT_TITLE),
    status: text({
      enum: [
        "draft",
        "review-requested",
        "review-approved",
        "review-denied",
        "review-change-requested",
      ] as const satisfies (typeof contentCampaignStatusSchema.infer)[],
    })
      .notNull()
      .default(CAMPAIGN_DEFAULT_STATUS),
    workspaceBlobUri: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_content_campaign_org_idx").on(table.organizationId),
    index("seo_content_campaign_project_idx").on(table.projectId),
    index("seo_content_campaign_created_by_user_idx").on(table.createdByUserId),
    index("seo_content_campaign_status_idx").on(table.status),
    index("seo_content_campaign_title_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.title})`,
    ),
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
    createdByUser: one(user, {
      fields: [seoContentCampaign.createdByUserId],
      references: [user.id],
    }),
    scheduledContents: many(seoContentSchedule),
    messages: many(seoContentCampaignMessage),
  }),
);

export const seoContentCampaignInsertSchema = createInsertSchema(
  seoContentCampaign,
).omit(
  "id",
  "createdAt",
  "updatedAt",
  "organizationId",
  "createdByUserId",
  "workspaceBlobUri",
);
export const seoContentCampaignSelectSchema =
  createSelectSchema(seoContentCampaign);
export const seoContentCampaignUpdateSchema = createUpdateSchema(
  seoContentCampaign,
)
  .omit("createdAt", "updatedAt", "createdByUserId")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
    }),
  );
