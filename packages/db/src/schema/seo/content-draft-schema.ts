import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import { ARTICLE_TYPES } from "@rectangular-labs/core/schemas/content-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations, sql } from "drizzle-orm";
import { index, text, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { organization, user } from "../auth-schema";
import { seoChat } from "./chat-schema";
import { seoContent } from "./content-schema";
import { seoProject } from "./project-schema";
import { seoTaskRun } from "./task-run-schema";

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
    originatingChatId: uuid().references(() => seoChat.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdByUserId: text().references(() => user.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    targetReleaseDate: timestamp({ mode: "date", withTimezone: true })
      .notNull()
      .defaultNow(),

    title: text().notNull().default(""),
    description: text().notNull().default(""),
    slug: text().notNull(),
    primaryKeyword: text().notNull(),
    // we don't have published / scheduled statuses for drafts since they will be promoted to content-schema when they hit those statuses
    status: text({
      enum: [
        "suggested",
        "suggestion-rejected",
        "queued",
        "planning",
        "writing",
        "reviewing-writing",
        "pending-review",
        "scheduled",
        "published",
        "review-denied",
        "deleted",
      ] as const satisfies SeoFileStatus[],
    })
      .notNull()
      .default("suggested"),

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
    articleType: text({ enum: ARTICLE_TYPES }),
    contentMarkdown: text(),

    ...timestamps,
  },
  (table) => [
    // note that the lack of unique constraints on the slug is intentional because we can have two drafts of the same content being worked on concurrently.
    unique("seo_content_draft_org_project_chat_slug_unique").on(
      table.organizationId,
      table.projectId,
      table.originatingChatId,
      table.slug,
    ),
    index("seo_content_branch_org_project_chat_slug_prefix_idx").using(
      "btree",
      table.organizationId,
      table.projectId,
      table.originatingChatId,
      sql`${table.slug} text_pattern_ops`,
    ),
    index("seo_content_branch_org_idx").on(table.organizationId),
    index("seo_content_branch_project_idx").on(table.projectId),
    index("seo_content_branch_base_content_id_idx").on(table.baseContentId),
    index("seo_content_branch_originating_chat_id_idx").on(
      table.originatingChatId,
    ),
    index("seo_content_branch_status_idx").on(table.status),
    index("seo_content_branch_deleted_at_idx").on(table.deletedAt),
  ],
);

export const seoContentDraftRelations = relations(
  seoContentDraft,
  ({ one }) => ({
    baseContent: one(seoContent, {
      fields: [seoContentDraft.baseContentId],
      references: [seoContent.id],
    }),
    originatingChat: one(seoChat, {
      fields: [seoContentDraft.originatingChatId],
      references: [seoChat.id],
    }),
    createdByUser: one(user, {
      fields: [seoContentDraft.createdByUserId],
      references: [user.id],
    }),
    outlineTask: one(seoTaskRun, {
      fields: [seoContentDraft.outlineGeneratedByTaskRunId],
      references: [seoTaskRun.id],
    }),
    contentTask: one(seoTaskRun, {
      fields: [seoContentDraft.generatedByTaskRunId],
      references: [seoTaskRun.id],
    }),
  }),
);

export const seoContentDraftInsertSchema = createInsertSchema(
  seoContentDraft,
).omit("id", "createdAt", "updatedAt");
export const seoContentDraftSelectSchema = createSelectSchema(seoContentDraft);
export const seoContentDraftUpdateSchema = createUpdateSchema(seoContentDraft)
  .omit("createdAt", "updatedAt")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
    }),
  );
