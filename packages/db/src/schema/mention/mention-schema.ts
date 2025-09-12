import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
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

export const smMention = pgMentionTable(
  "mention",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    provider: text().notNull().default("reddit"),
    providerId: text().notNull(),
    providerUrl: text(),
    providerCreatedAt: timestamp({ withTimezone: true, mode: "date" }),
    author: text(),
    title: text(),
    content: text(),
    metadata: jsonb().$type<{ type: "reddit"; subreddit: string }>(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sm_mention_provider_unique").on(
      table.provider,
      table.providerId,
    ),
    index("sm_mention_provider_created_at_idx").on(table.providerCreatedAt),
    index("sm_mention_created_at_idx").on(table.createdAt),
  ],
);

export const mentionInsertSchema = createInsertSchema(smMention);
export const mentionSelectSchema = createSelectSchema(smMention);
export const mentionUpdateSchema = createUpdateSchema(smMention);
