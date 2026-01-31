import {
  STRATEGY_PHASE_STATUSES,
  type strategyGoalSchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { isNull, relations } from "drizzle-orm";
import { index, jsonb, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoProject } from "./project-schema";
import { seoStrategyPhase } from "./strategy-phase-schema";
import { seoStrategySnapshot } from "./strategy-snapshot-schema";

export const seoStrategy = pgSeoTable(
  "strategy",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    projectId: uuid()
      .notNull()
      .references(() => seoProject.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    name: text().notNull(),
    description: text(),
    motivation: text().notNull(),
    goal: jsonb().$type<typeof strategyGoalSchema.infer>().notNull(),
    status: text({ enum: STRATEGY_PHASE_STATUSES })
      .notNull()
      .default("suggestion"),
    ...timestamps,
  },
  (table) => [
    index("seo_strategy_project_updated_at_idx")
      .on(table.projectId, table.updatedAt)
      .where(isNull(table.deletedAt)),
    index("seo_strategy_status_idx").on(table.status),
  ],
);

export const seoStrategyRelations = relations(seoStrategy, ({ one, many }) => ({
  project: one(seoProject, {
    fields: [seoStrategy.projectId],
    references: [seoProject.id],
  }),
  phases: many(seoStrategyPhase),
  snapshots: many(seoStrategySnapshot),
}));

export const seoStrategyInsertSchema = createInsertSchema(seoStrategy).omit(
  "id",
  "createdAt",
  "updatedAt",
  "deletedAt",
);
export const seoStrategySelectSchema = createSelectSchema(seoStrategy);
export const seoStrategyUpdateSchema = createUpdateSchema(seoStrategy)
  .omit("createdAt", "updatedAt", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
    }),
  );
