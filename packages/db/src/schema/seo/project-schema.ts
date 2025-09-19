import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoTaskRun } from "./task-run-schema";

export const seoWebsiteInfoSchema = type({
  version: "'v1'",
  businessOverview: "string",
  idealCustomer: "string",
  serviceRegion: "string",
  industry: "string",
});

export const seoProject = pgSeoTable(
  "project",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    organizationId: text()
      .notNull()
      .references(() => organization.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    websiteUrl: text().notNull(),
    websiteInfo: jsonb().$type<typeof seoWebsiteInfoSchema.infer>(),
    ...timestamps,
  },
  (table) => [
    index("seo_project_org_idx").on(table.organizationId),
    index("seo_project_website_url_idx").on(table.websiteUrl),
  ],
);

export const seoProjectRelations = relations(seoProject, ({ one, many }) => ({
  organization: one(organization, {
    fields: [seoProject.organizationId],
    references: [organization.id],
  }),
  tasks: many(seoTaskRun),
}));
export const seoProjectInsertSchema = createInsertSchema(seoProject);
export const seoProjectSelectSchema = createSelectSchema(seoProject);
export const seoProjectUpdateSchema = createUpdateSchema(seoProject);
