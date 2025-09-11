import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import {
  index,
  jsonb,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgMentionTable } from "../_table";
import { smKeyword } from "./keyword-schema";
import { smProject } from "./project-schema";
import { smReply } from "./reply-schema";

export const smMention = pgMentionTable(
  "mention",
  {
    id: uuid("sm_mention_id").primaryKey().$defaultFn(uuidv7),
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
    provider: text().notNull().default("reddit"),
    providerMentionId: text().notNull(),
    providerMentionUrl: text(),
    providerMentionCreatedAt: timestamp({ withTimezone: true, mode: "date" }),
    author: text(),
    title: text(),
    content: text(),
    metadata: jsonb().$type<{ type: "reddit"; subreddit: string }>(),
    ...timestamps,
  },
  (table) => [
    index("sm_mention_project_idx").on(table.projectId),
    index("sm_mention_keyword_idx").on(table.keywordId),
    uniqueIndex("sm_mention_provider_unique").on(
      table.provider,
      table.providerMentionId,
    ),
    index("sm_mention_provider_created_at_idx").on(
      table.providerMentionCreatedAt,
    ),
    index("sm_mention_created_at_idx").on(table.createdAt),
  ],
);

export const smMentionTableRelations = relations(
  smMention,
  ({ one, many }) => ({
    project: one(smProject, {
      fields: [smMention.projectId],
      references: [smProject.id],
    }),
    keyword: one(smKeyword, {
      fields: [smMention.keywordId],
      references: [smKeyword.id],
    }),
    replies: many(smReply),
  }),
);
export const mentionInsertSchema = createInsertSchema(smMention);
export const mentionSelectSchema = createSelectSchema(smMention);
export const mentionUpdateSchema = createUpdateSchema(smMention);
