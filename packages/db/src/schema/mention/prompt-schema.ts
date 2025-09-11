import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";
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
  keywords: many(smKeyword),
}));
