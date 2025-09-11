import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { boolean, index, integer, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { organization } from "./auth-schema";
import { smKeyword } from "./keyword-schema";
import { smPrompt } from "./prompt-schema";

export const smProject = pgMentionTable(
  "project",
  {
    id: uuid("sm_project_id").primaryKey().$defaultFn(uuidv7),
    organizationId: text().references(() => organization.id, {
      onDelete: "cascade",
      onUpdate: "cascade",
    }),
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
    index("sm_project_org_idx").on(table.organizationId),
    index("sm_project_current_reply_prompt_idx").on(table.currentReplyPromptId),
  ],
);

export const smProjectRelations = relations(smProject, ({ many, one }) => ({
  organization: one(organization, {
    fields: [smProject.organizationId],
    references: [organization.id],
  }),
  keywords: many(smKeyword),
  replyPrompts: one(smPrompt, {
    fields: [smProject.currentReplyPromptId],
    references: [smPrompt.id],
  }),
}));
export const projectInsertSchema = createInsertSchema(smProject);
export const projectSelectSchema = createSelectSchema(smProject);
export const projectUpdateSchema = createUpdateSchema(smProject);
