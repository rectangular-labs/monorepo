import { ARTICLE_TYPES } from "@rectangular-labs/core/schemas/content-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { isNull, relations, sql } from "drizzle-orm";
import {
  index,
  integer,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoProject } from "./project-schema";

/**
 * Published content versions (immutable).
 *
 * Each row is a snapshot of content at the time of publishing.
 * To edit published content: create a draft, modify it, publish → creates new version.
 * To rollback: duplicate the old version with a larger version number.
 */
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

    // Versioning - each publish increments version for the same slug
    slug: text().notNull(),
    version: integer().notNull().default(1),

    // Content fields
    title: text().notNull(),
    description: text().notNull(),
    heroImage: text(),
    heroImageCaption: text(),
    primaryKeyword: text().notNull(),
    articleType: text({ enum: ARTICLE_TYPES }).notNull(),
    contentMarkdown: text().notNull(),
    outline: text(),
    notes: text(),

    // Publishing metadata
    publishedAt: timestamp({ mode: "date", withTimezone: true }).notNull(),

    ...timestamps,
  },
  (table) => [
    // Each slug can have multiple versions, but (project, slug, version) is unique
    unique("seo_content_project_slug_version_unique").on(
      table.projectId,
      table.slug,
      table.version,
    ),
    // For finding latest version of a slug within a project/org
    index("seo_content_org_project_slug_version_desc_idx")
      .using(
        "btree",
        table.organizationId,
        table.projectId,
        table.slug,
        sql`${table.version} DESC`,
      )
      .where(isNull(table.deletedAt)),
  ],
);

export const seoContentRelations = relations(seoContent, ({ one }) => ({
  project: one(seoProject, {
    fields: [seoContent.projectId],
    references: [seoProject.id],
  }),
  organization: one(organization, {
    fields: [seoContent.organizationId],
    references: [organization.id],
  }),
}));

export const seoContentInsertSchema = createInsertSchema(seoContent).omit(
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
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
