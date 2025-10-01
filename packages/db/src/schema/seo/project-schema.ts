import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, unique, uuid } from "drizzle-orm/pg-core";
import type {
  seoSerpSnapshotSchema,
  seoWebsiteInfoSchema,
} from "../../schema-parsers/project-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoContentCampaign } from "./content-campaign-schema";
import { seoTaskRun } from "./task-run-schema";

export const seoProject = pgSeoTable(
  "project",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    slug: text(),
    name: text(),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    websiteUrl: text().notNull(),
    websiteInfo: jsonb().$type<typeof seoWebsiteInfoSchema.infer>(),
    serpSnapshot: jsonb().$type<typeof seoSerpSnapshotSchema.infer>(),
    ...timestamps,
  },
  (table) => [
    unique("seo_project_org_slug_idx").on(table.organizationId, table.slug),
    unique("seo_project_org_website_url_idx").on(
      table.organizationId,
      table.websiteUrl,
    ),
    index("seo_project_org_idx").on(table.organizationId),
    index("seo_project_website_url_idx").on(table.websiteUrl),
  ],
);

export const seoProjectRelations = relations(seoProject, ({ one, many }) => ({
  organization: one(organization, {
    fields: [seoProject.organizationId],
    references: [organization.id],
  }),
  campaigns: many(seoContentCampaign),
  tasks: many(seoTaskRun),
}));

export const seoProjectInsertSchema = createInsertSchema(seoProject).omit(
  "id",
  "createdAt",
  "updatedAt",
  "organizationId",
);
export const seoProjectSelectSchema = createSelectSchema(seoProject);
export const seoProjectUpdateSchema = createUpdateSchema(seoProject)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
