import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import type { contentScheduleStatusSchema } from "../../schema-parsers/content-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoContentCampaign } from "./content-campaign-schema";
import { seoContent } from "./content-schema";
import { seoProject } from "./project-schema";

export const seoContentSchedule = pgSeoTable(
  "content_schedule",
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
    contentId: uuid()
      .notNull()
      .references(() => seoContent.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    originatingContentCampaignId: uuid()
      .notNull()
      .references(() => seoContentCampaign.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    status: text({
      enum: [
        "draft",
        "scheduled",
        "published",
      ] as const satisfies (typeof contentScheduleStatusSchema.infer)[],
    })
      .notNull()
      .default("draft"),
    scheduledFor: timestamp({ mode: "date", withTimezone: true }),
    publishedAt: timestamp({ mode: "date", withTimezone: true }),
    publishedLinks: jsonb()
      .$type<string[]>()
      .notNull()
      .$defaultFn(() => []),
    ...timestamps,
  },
  (table) => [
    index("seo_content_schedule_org_idx").on(table.organizationId),
    index("seo_content_schedule_project_idx").on(table.projectId),
    index("seo_content_schedule_originating_content_campaign_idx").on(
      table.originatingContentCampaignId,
    ),
    index("seo_content_schedule_content_idx").on(table.contentId),
    index("seo_content_schedule_status_idx").on(table.status),
    index("seo_content_schedule_scheduled_for_idx").on(table.scheduledFor),
    index("seo_content_schedule_published_at_idx").on(table.publishedAt),
  ],
);

export const seoContentScheduleRelations = relations(
  seoContentSchedule,
  ({ one }) => ({
    project: one(seoProject, {
      fields: [seoContentSchedule.projectId],
      references: [seoProject.id],
    }),
    organization: one(organization, {
      fields: [seoContentSchedule.organizationId],
      references: [organization.id],
    }),
    content: one(seoContent, {
      fields: [seoContentSchedule.contentId],
      references: [seoContent.id],
    }),
    originatingContentCampaign: one(seoContentCampaign, {
      fields: [seoContentSchedule.originatingContentCampaignId],
      references: [seoContentCampaign.id],
    }),
  }),
);

export const seoContentScheduleInsertSchema = createInsertSchema(
  seoContentSchedule,
).omit("id", "createdAt", "updatedAt");
export const seoContentScheduleSelectSchema =
  createSelectSchema(seoContentSchedule);
export const seoContentScheduleUpdateSchema = createUpdateSchema(
  seoContentSchedule,
)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
