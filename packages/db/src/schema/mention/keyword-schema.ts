import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeywordSourceCursor } from "./keyword-source-cursor-schema";
import { smProjectKeyword } from "./project-keyword-schema";

export const smKeyword = pgMentionTable(
  "keyword",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    phrase: text().notNull(),
    ...timestamps,
  },
  (table) => [
    index("sm_keyword_phrase_idx").on(table.phrase),
    index("sm_keyword_created_at_idx").on(table.createdAt),
  ],
);

export const smKeywordRelations = relations(smKeyword, ({ many }) => ({
  projectKeywords: many(smProjectKeyword),
  keywordSourceCursors: many(smKeywordSourceCursor),
}));
export const keywordInsertSchema = createInsertSchema(smKeyword);
export const keywordUpdateSchema = createUpdateSchema(smKeyword);
export const keywordSelectSchema = createSelectSchema(smKeyword);
