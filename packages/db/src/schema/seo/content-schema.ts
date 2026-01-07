import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoContentSchedule } from "./content-schedule-schema";
import { seoContentSearchKeyword } from "./content-search-keywords-schema";
import { seoProject } from "./project-schema";

export const seoContent = pgSeoTable(
  "content",
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

    slug: text().notNull(),
    title: text().notNull(),
    createdByUserId: text()
      .notNull()
      .references(() => user.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tags: jsonb()
      .$type<string[]>()
      .$defaultFn(() => []),
    publishDestinations: jsonb()
      .$type<string[]>()
      .$defaultFn(() => []),

    ...timestamps,
  },
  (table) => [
    index("seo_content_organization_idx").on(table.organizationId),
    index("seo_content_project_idx").on(table.projectId),
    index("seo_content_created_by_user_idx").on(table.createdByUserId),
    unique("seo_content_project_slug_idx").on(table.projectId, table.slug),
  ],
);

export const seoContentRelations = relations(seoContent, ({ one, many }) => ({
  project: one(seoProject, {
    fields: [seoContent.projectId],
    references: [seoProject.id],
  }),
  organization: one(organization, {
    fields: [seoContent.organizationId],
    references: [organization.id],
  }),
  createdByUser: one(user, {
    fields: [seoContent.createdByUserId],
    references: [user.id],
  }),
  searchKeywordsMap: many(seoContentSearchKeyword),
  schedules: many(seoContentSchedule),
}));

export const seoContentInsertSchema = createInsertSchema(seoContent).omit(
  "id",
  "createdAt",
  "updatedAt",
);
export const seoContentSelectSchema = createSelectSchema(seoContent);
export const seoContentUpdateSchema = createUpdateSchema(seoContent)
  .omit("createdAt", "updatedAt")
  .merge(type({ id: "string.uuid" }));
