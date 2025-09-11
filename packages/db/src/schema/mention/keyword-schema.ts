import { relations } from "drizzle-orm";
import { boolean, index, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smMention } from "./mention-schema";
import { smProject } from "./project-schema";
import { smPrompt } from "./prompt-schema";

export const smKeyword = pgMentionTable(
  "keyword",
  {
    id: uuid("sm_keyword_id").primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => smProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    replyPromptOverrideId: uuid().references(() => smPrompt.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    phrase: text().notNull(),
    nextRunAt: timestamp({ withTimezone: true, mode: "date" }),
    lastRunAt: timestamp({ withTimezone: true, mode: "date" }),
    isPaused: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("sm_keyword_project_idx").on(table.projectId),
    index("sm_keyword_phrase_idx").on(table.phrase),
    index("sm_keyword_next_run_at_idx").on(table.nextRunAt),
    index("sm_keyword_created_at_idx").on(table.createdAt),
  ],
);

export const smKeywordRelations = relations(smKeyword, ({ one, many }) => ({
  project: one(smProject, {
    fields: [smKeyword.projectId],
    references: [smProject.id],
  }),
  mentions: many(smMention),
  replyPrompts: one(smPrompt, {
    fields: [smKeyword.replyPromptOverrideId],
    references: [smPrompt.id],
  }),
}));
