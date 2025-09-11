import { relations } from "drizzle-orm";
import { boolean, index, integer, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";
import { smPrompt } from "./prompt-schema";

export const smProject = pgMentionTable(
  "project",
  {
    id: uuid("sm_project_id").primaryKey().$defaultFn(uuidv7),
    orgId: text(),
    currentReplyPromptId: uuid().references(() => smPrompt.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    pollingIntervalSec: integer().notNull().default(900),
    autoGenerateReplies: boolean().notNull().default(false),
    isPaused: boolean().notNull().default(false),
    ...timestamps,
  },
  (table) => [
    index("sm_project_org_idx").on(table.orgId),
    index("sm_project_current_reply_prompt_idx").on(table.currentReplyPromptId),
  ],
);

export const smProjectRelations = relations(smProject, ({ many, one }) => ({
  keywords: many(smKeyword),
  replyPrompts: one(smPrompt, {
    fields: [smProject.currentReplyPromptId],
    references: [smPrompt.id],
  }),
}));
