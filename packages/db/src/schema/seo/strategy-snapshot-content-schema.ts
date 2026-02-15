import type {
  KeywordSnapshot,
  SnapshotAggregate,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentDraft } from "./content-draft-schema";
import { seoStrategySnapshot } from "./strategy-snapshot-schema";

export const seoStrategySnapshotContent = pgSeoTable(
  "strategy_snapshot_content",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    snapshotId: uuid()
      .notNull()
      .references(() => seoStrategySnapshot.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    contentDraftId: uuid()
      .notNull()
      .references(() => seoContentDraft.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    aggregate: jsonb().$type<SnapshotAggregate>().notNull(),
    topKeywords: jsonb().$type<KeywordSnapshot[]>().notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_strategy_snapshot_content_snapshot_idx").on(table.snapshotId),
    index("seo_strategy_snapshot_content_draft_idx").on(table.contentDraftId),
  ],
);

export const seoStrategySnapshotContentRelations = relations(
  seoStrategySnapshotContent,
  ({ one }) => ({
    snapshot: one(seoStrategySnapshot, {
      fields: [seoStrategySnapshotContent.snapshotId],
      references: [seoStrategySnapshot.id],
    }),
    contentDraft: one(seoContentDraft, {
      fields: [seoStrategySnapshotContent.contentDraftId],
      references: [seoContentDraft.id],
    }),
  }),
);

export const seoStrategySnapshotContentInsertSchema = createInsertSchema(
  seoStrategySnapshotContent,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoStrategySnapshotContentSelectSchema = createSelectSchema(
  seoStrategySnapshotContent,
);
export const seoStrategySnapshotContentUpdateSchema = createUpdateSchema(
  seoStrategySnapshotContent,
)
  .omit("createdAt", "updatedAt", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      snapshotId: "string.uuid",
    }),
  );
