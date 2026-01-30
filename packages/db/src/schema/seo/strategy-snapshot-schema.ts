import {
  type SnapshotAggregate,
  type SnapshotDelta,
  strategySnapshotTriggers,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, jsonb, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoStrategyPhase } from "./strategy-phase-schema";
import { seoStrategy } from "./strategy-schema";
import { seoStrategySnapshotContent } from "./strategy-snapshot-content-schema";

export const seoStrategySnapshot = pgSeoTable(
  "strategy_snapshot",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    strategyId: uuid()
      .notNull()
      .references(() => seoStrategy.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    phaseId: uuid().references(() => seoStrategyPhase.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    takenAt: timestamp({ mode: "date", withTimezone: true }).notNull(),
    triggerType: text({ enum: strategySnapshotTriggers }).notNull(),
    aggregate: jsonb().$type<SnapshotAggregate>().notNull(),
    delta: jsonb().$type<SnapshotDelta>(),
    aiInsight: text(),
    ...timestamps,
  },
  (table) => [
    index("seo_strategy_snapshot_strategy_idx").on(table.strategyId),
    index("seo_strategy_snapshot_phase_idx").on(table.phaseId),
    index("seo_strategy_snapshot_taken_at_idx").on(table.takenAt),
  ],
);

export const seoStrategySnapshotRelations = relations(
  seoStrategySnapshot,
  ({ one, many }) => ({
    strategy: one(seoStrategy, {
      fields: [seoStrategySnapshot.strategyId],
      references: [seoStrategy.id],
    }),
    phase: one(seoStrategyPhase, {
      fields: [seoStrategySnapshot.phaseId],
      references: [seoStrategyPhase.id],
    }),
    contents: many(seoStrategySnapshotContent),
  }),
);

export const seoStrategySnapshotInsertSchema = createInsertSchema(
  seoStrategySnapshot,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoStrategySnapshotSelectSchema =
  createSelectSchema(seoStrategySnapshot);
export const seoStrategySnapshotUpdateSchema = createUpdateSchema(
  seoStrategySnapshot,
)
  .omit("createdAt", "updatedAt", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      strategyId: "string.uuid",
    }),
  );
