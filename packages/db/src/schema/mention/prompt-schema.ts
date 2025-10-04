import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smProject } from "./project-schema";

export const smPrompt = pgMentionTable(
  "prompt",
  {
    id: uuid("sm_prompt_id").primaryKey().$defaultFn(uuidv7),
    prompt: text(),
    ...timestamps,
  },
  (table) => [index("sm_prompt_created_at_idx").on(table.createdAt)],
);

export const smPromptRelations = relations(smPrompt, ({ many }) => ({
  projects: many(smProject),
}));
export const promptInsertSchema = createInsertSchema(smPrompt);
export const promptSelectSchema = createSelectSchema(smPrompt);
export const promptUpdateSchema = createUpdateSchema(smPrompt);
