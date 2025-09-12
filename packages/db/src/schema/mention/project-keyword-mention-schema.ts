import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  foreignKey,
  index,
  primaryKey,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";
import { smMention } from "./mention-schema";
import { smProjectKeyword } from "./project-keyword-schema";
import { smProject } from "./project-schema";

export const smProjectKeywordMention = pgMentionTable(
  "project_keyword_mention",
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
    mentionId: uuid()
      .notNull()
      .references(() => smMention.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    matchedAt: timestamp({ withTimezone: true, mode: "date" }).notNull(),
    status: text({ enum: ["new", "ignored", "replied"] })
      .notNull()
      .default("new"),
    ...timestamps,
  },
  (table) => [
    primaryKey({
      columns: [table.projectId, table.keywordId, table.mentionId],
    }),
    foreignKey({
      name: "sm_pkm_project_keyword_fk",
      columns: [table.projectId, table.keywordId],
      foreignColumns: [smProjectKeyword.projectId, smProjectKeyword.keywordId],
    }),
    index("sm_pkm_project_idx").on(table.projectId),
    index("sm_pkm_keyword_idx").on(table.keywordId),
    index("sm_pkm_mention_idx").on(table.mentionId),
    index("sm_pkm_status_idx").on(table.status),
    index("sm_pkm_matched_at_idx").on(table.matchedAt),
    index("sm_pkm_created_at_idx").on(table.createdAt),
  ],
);

export const smProjectKeywordMentionRelations = relations(
  smProjectKeywordMention,
  ({ one }) => ({
    project: one(smProject, {
      fields: [smProjectKeywordMention.projectId],
      references: [smProject.id],
    }),
    keyword: one(smKeyword, {
      fields: [smProjectKeywordMention.keywordId],
      references: [smKeyword.id],
    }),
    mention: one(smMention, {
      fields: [smProjectKeywordMention.mentionId],
      references: [smMention.id],
    }),
  }),
);

export const projectKeywordMentionInsertSchema = createInsertSchema(
  smProjectKeywordMention,
);
export const projectKeywordMentionUpdateSchema = createUpdateSchema(
  smProjectKeywordMention,
);
export const projectKeywordMentionSelectSchema = createSelectSchema(
  smProjectKeywordMention,
);
