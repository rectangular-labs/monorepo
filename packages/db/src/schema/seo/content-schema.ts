import { ARTICLE_TYPES } from "@rectangular-labs/core/schemas/content-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  text,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoContentDraft } from "./content-draft-schema";
import { seoContentSchedule } from "./content-schedule-schema";
import { seoProject } from "./project-schema";
import { seoTaskRun } from "./task-run-schema";

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
    createdByUserUserId: text().references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    version: integer().notNull().default(1),
    isCurrentPublished: boolean().notNull().default(false),

    title: text().notNull(),
    description: text().notNull(),
    slug: text().notNull(),
    primaryKeyword: text().notNull(),

    notes: text(),
    outlineGeneratedByTaskRunId: uuid().references(() => seoTaskRun.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    outline: text(),

    generatedByTaskRunId: uuid().references(() => seoTaskRun.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    articleType: text({ enum: ARTICLE_TYPES }).notNull(),
    contentMarkdown: text().notNull(),

    ...timestamps,
  },
  (table) => [
    unique("seo_content_version_idx").on(
      table.projectId,
      table.slug,
      table.version,
    ),
    unique("seo_content_version_idx").on(
      table.projectId,
      table.title,
      table.version,
    ),
    index("seo_content_project_idx").on(table.projectId),
    index("seo_content_organization_idx").on(table.organizationId),
    index("seo_content_created_by_user_idx").on(table.createdByUserUserId),
    index("seo_content_slug_idx").on(table.slug),
    index("seo_content_primary_keyword_idx").on(table.primaryKeyword),
    index("seo_content_version_idx").on(table.version),
    index("seo_content_is_current_published_idx").on(table.isCurrentPublished),
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
    fields: [seoContent.createdByUserUserId],
    references: [user.id],
  }),
  outlineTask: one(seoTaskRun, {
    fields: [seoContent.outlineGeneratedByTaskRunId],
    references: [seoTaskRun.id],
  }),
  contentTask: one(seoTaskRun, {
    fields: [seoContent.generatedByTaskRunId],
    references: [seoTaskRun.id],
  }),
  schedules: many(seoContentSchedule),
  drafts: many(seoContentDraft),
}));

export const seoContentInsertSchema = createInsertSchema(seoContent).omit(
  "id",
  "createdAt",
  "updatedAt",
);
export const seoContentSelectSchema = createSelectSchema(seoContent);
export const seoContentUpdateSchema = createUpdateSchema(seoContent)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
    }),
  );
