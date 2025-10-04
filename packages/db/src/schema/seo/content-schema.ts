import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  numeric,
  text,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import type {
  campaignTypeSchema,
  contentCategorySchema,
  contentTypeSchema,
  statusSchema,
} from "../../schema-parsers/content-parsers";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
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

    // Campaign metadata
    campaignType: text({
      enum: [
        "do-nothing",
        "improvement",
        "new-content",
      ] as const satisfies (typeof campaignTypeSchema.infer)[],
    }).notNull(),
    status: text({
      enum: [
        "analyzing",
        "new",
        "ready",
        "generating-content",
        "content-ready",
        "published",
      ] as const satisfies (typeof statusSchema.infer)[],
    })
      .notNull()
      .default("analyzing"),
    pathname: text().notNull(),
    markdownVersions: jsonb()
      .$type<
        {
          title: string;
          description?: string;
          markdown: string;
          createdAt: string;
        }[]
      >()
      .$defaultFn(() => []),
    impactScore: numeric({ precision: 10, scale: 2 }).notNull().default("0"),

    // Content strategy
    proposedFormat: text({
      enum: [
        "blog",
        "listicle",
        "guide",
        "comparison",
        "how-to",
        "checklist",
        "case-study",
        "other",
      ] as const satisfies (typeof contentTypeSchema.infer)[],
    }),
    contentCategory: text({
      enum: [
        "money-page",
        "authority-builder",
        "quick-win",
      ] as const satisfies (typeof contentCategorySchema.infer)[],
    }).notNull(),

    ...timestamps,
  },
  (table) => [
    index("seo_content_organization_idx").on(table.organizationId),
    index("seo_content_project_idx").on(table.projectId),
    uniqueIndex("seo_content_pathname_unique").on(table.pathname),
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
  searchKeywordsMap: many(seoContentSearchKeyword),
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
