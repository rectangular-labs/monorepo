import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { text, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeywordSourceCursor } from "./keyword-source-cursor-schema";
import { smProjectKeyword } from "./project-keyword-schema";
import { type } from "arktype";

export const smKeyword = pgMentionTable(
  "keyword",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    phrase: text().notNull(),
    ...timestamps,
  },
  (table) => [uniqueIndex("sm_keyword_phrase_unique").on(table.phrase)],
);

export const smKeywordRelations = relations(smKeyword, ({ many }) => ({
  projectKeywords: many(smProjectKeyword),
  keywordSourceCursors: many(smKeywordSourceCursor),
}));
export const keywordInsertSchema = createInsertSchema(smKeyword).omit(
  "createdAt",
  "updatedAt",
  "id",
);
export const keywordUpdateSchema = createUpdateSchema(smKeyword)
  .omit("createdAt", "updatedAt", "id")
  .merge(type({ phrase: "string >= 1" }));
export const keywordSelectSchema = createSelectSchema(smKeyword);
