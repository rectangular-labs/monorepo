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
  primaryKey,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";
import { smProject } from "./project-schema";

export const smProjectKeyword = pgMentionTable(
  "project_keyword",
  {
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    keywordId: uuid()
      .notNull()
      .references(() => smKeyword.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    pollingIntervalSec: integer(),
    nextRunAt: timestamp({ withTimezone: true, mode: "date" }),
    lastRunAt: timestamp({ withTimezone: true, mode: "date" }),
    isPaused: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    primaryKey({ columns: [table.projectId, table.keywordId] }),
    index("sm_project_keyword_project_idx").on(table.projectId),
    index("sm_project_keyword_keyword_idx").on(table.keywordId),
    index("sm_project_keyword_next_run_at_idx").on(table.nextRunAt),
    index("sm_project_keyword_created_at_idx").on(table.createdAt),
  ],
);

export const smProjectKeywordRelations = relations(
  smProjectKeyword,
  ({ one }) => ({
    project: one(smProject, {
      fields: [smProjectKeyword.projectId],
      references: [smProject.id],
    }),
    keyword: one(smKeyword, {
      fields: [smProjectKeyword.keywordId],
      references: [smKeyword.id],
    }),
  }),
);

export const projectKeywordInsertSchema = createInsertSchema(smProjectKeyword);
export const projectKeywordUpdateSchema = createUpdateSchema(smProjectKeyword);
export const projectKeywordSelectSchema = createSelectSchema(smProjectKeyword);
