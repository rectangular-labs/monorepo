import {
  type PublishingCadence,
  STRATEGY_PHASE_STATUSES,
  STRATEGY_PHASE_TYPE,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { isNull, relations } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoStrategyPhaseContent } from "./strategy-phase-content-schema";
import { seoStrategy } from "./strategy-schema";
import { seoStrategySnapshot } from "./strategy-snapshot-schema";

export const seoStrategyPhase = pgSeoTable(
  "strategy_phase",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    strategyId: uuid()
      .notNull()
      .references(() => seoStrategy.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text({ enum: STRATEGY_PHASE_TYPE }).notNull(),
    name: text().notNull(),
    observationWeeks: integer().notNull().default(0),
    successCriteria: text().notNull(),
    cadence: jsonb().$type<PublishingCadence>().notNull(),
    status: text({ enum: STRATEGY_PHASE_STATUSES })
      .notNull()
      .default("suggestion"),
    targetCompletionDate: timestamp({ mode: "date", withTimezone: true }),
    startedAt: timestamp({ mode: "date", withTimezone: true }),
    completedAt: timestamp({ mode: "date", withTimezone: true }),
    observationEndsAt: timestamp({ mode: "date", withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("seo_strategy_phase_strategy_created_at_idx")
      .on(table.strategyId, table.createdAt)
      .where(isNull(table.deletedAt)),
    index("seo_strategy_phase_status_idx").on(table.status),
  ],
);

export const seoStrategyPhaseRelations = relations(
  seoStrategyPhase,
  ({ one, many }) => ({
    strategy: one(seoStrategy, {
      fields: [seoStrategyPhase.strategyId],
      references: [seoStrategy.id],
    }),
    phaseContents: many(seoStrategyPhaseContent),
    snapshots: many(seoStrategySnapshot),
  }),
);

export const seoStrategyPhaseInsertSchema = createInsertSchema(
  seoStrategyPhase,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoStrategyPhaseSelectSchema =
  createSelectSchema(seoStrategyPhase);
export const seoStrategyPhaseUpdateSchema = createUpdateSchema(seoStrategyPhase)
  .omit("createdAt", "updatedAt", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      strategyId: "string.uuid",
    }),
  );
