import {
  ARTICLE_TYPES,
  CONTENT_STATUSES,
} from "@rectangular-labs/core/schemas/content-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { isNull, relations, sql } from "drizzle-orm";
import { index, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization } from "../auth-schema";
import { seoContentDraftChat } from "./content-draft-chat-schema";
import { seoContentDraftUser } from "./content-draft-user-schema";
import { seoContent } from "./content-schema";
import { seoProject } from "./project-schema";
import { seoStrategyPhaseContent } from "./strategy-phase-content-schema";
import { seoStrategy } from "./strategy-schema";
import { seoStrategySnapshotContent } from "./strategy-snapshot-content-schema";
import { seoTaskRun } from "./task-run-schema";

/**
 * Content drafts.
 *
 * Only ONE draft can exist per (project, slug) at a time.
 * When published, the draft is deleted and a new Content version is created.
 */
export const seoContentDraft = pgSeoTable(
  "content_draft",
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
    baseContentId: uuid().references(() => seoContent.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
    strategyId: uuid().references(() => seoStrategy.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    // Content identification
    slug: text().notNull(),

    // Content fields (all optional during drafting)
    title: text().notNull().default(""),
    description: text().notNull().default(""),
    heroImage: text(),
    heroImageCaption: text(),
    primaryKeyword: text().notNull().default(""),
    articleType: text({ enum: ARTICLE_TYPES }),
    outline: text(),
    contentMarkdown: text(),
    notes: text(),

    status: text({ enum: CONTENT_STATUSES }).notNull().default("suggested"),
    scheduledFor: timestamp({ mode: "date", withTimezone: true }),

    // Task run references for AI-generated content
    outlineGeneratedByTaskRunId: uuid().references(() => seoTaskRun.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    generatedByTaskRunId: uuid().references(() => seoTaskRun.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),

    ...timestamps,
  },
  (table) => [
    // Only ONE draft per slug per project - no concurrent editing conflicts
    unique("seo_content_draft_project_slug_unique").on(
      table.projectId,
      table.slug,
    ),
    index("seo_content_draft_org_project_slug_idx")
      .using(
        "btree",
        table.organizationId,
        table.projectId,
        sql`${table.slug} text_pattern_ops`,
      )
      .where(isNull(table.deletedAt)),
    index("seo_content_draft_org_project_status_base_id_idx")
      .on(
        table.organizationId,
        table.projectId,
        table.status,
        table.baseContentId,
        table.id,
      )
      .where(isNull(table.deletedAt)),
  ],
);

export const seoContentDraftRelations = relations(
  seoContentDraft,
  ({ one, many }) => ({
    project: one(seoProject, {
      fields: [seoContentDraft.projectId],
      references: [seoProject.id],
    }),
    organization: one(organization, {
      fields: [seoContentDraft.organizationId],
      references: [organization.id],
    }),
    baseContent: one(seoContent, {
      fields: [seoContentDraft.baseContentId],
      references: [seoContent.id],
    }),
    strategy: one(seoStrategy, {
      fields: [seoContentDraft.strategyId],
      references: [seoStrategy.id],
    }),
    outlineTask: one(seoTaskRun, {
      fields: [seoContentDraft.outlineGeneratedByTaskRunId],
      references: [seoTaskRun.id],
    }),
    contentTask: one(seoTaskRun, {
      fields: [seoContentDraft.generatedByTaskRunId],
      references: [seoTaskRun.id],
    }),
    metricSnapshot: many(seoStrategySnapshotContent),
    phaseContent: many(seoStrategyPhaseContent),
    // Attribution join tables
    contributingChatsMap: many(seoContentDraftChat),
    contributorsMap: many(seoContentDraftUser),
  }),
);

export const seoContentDraftInsertSchema = createInsertSchema(
  seoContentDraft,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoContentDraftSelectSchema = createSelectSchema(seoContentDraft);
export const seoContentDraftUpdateSchema = createUpdateSchema(seoContentDraft)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
    }),
  );
