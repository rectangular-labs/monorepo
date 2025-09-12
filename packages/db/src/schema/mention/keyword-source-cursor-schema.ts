import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  index,
  integer,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";

export const smKeywordSourceCursor = pgMentionTable(
  "keyword_source_cursor",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    keywordId: uuid()
      .notNull()
      .references(() => smKeyword.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    source: text({ enum: ["reddit:post", "reddit:comment"] }).notNull(),
    currentCursor: text(),
    latestItemAt: timestamp({ withTimezone: true, mode: "date" }),
    emptyStreak: integer().notNull().default(0),
    nextEarliestRunAt: timestamp({ withTimezone: true, mode: "date" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sm_keyword_source_cursor_source_keyword_unique").on(
      table.source,
      table.keywordId,
    ),
    index("sm_keyword_source_cursor_src_idx").on(table.source),
    index("sm_keyword_source_cursor_kw_idx").on(table.keywordId),
    index("sm_keyword_source_cursor_created_at_idx").on(table.createdAt),
  ],
);

export const smKeywordSourceCursorRelations = relations(
  smKeywordSourceCursor,
  ({ one }) => ({
    keyword: one(smKeyword, {
      fields: [smKeywordSourceCursor.keywordId],
      references: [smKeyword.id],
    }),
  }),
);

export const keywordSourceCursorInsertSchema = createInsertSchema(
  smKeywordSourceCursor,
);
export const keywordSourceCursorUpdateSchema = createUpdateSchema(
  smKeywordSourceCursor,
);
export const keywordSourceCursorSelectSchema = createSelectSchema(
  smKeywordSourceCursor,
);
