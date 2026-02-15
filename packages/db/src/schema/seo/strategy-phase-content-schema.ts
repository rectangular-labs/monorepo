import { CONTENT_STRATEGY_ACTION } from "@rectangular-labs/core/schemas/strategy-parsers";
import { type } from "arktype";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-arktype";
import { relations } from "drizzle-orm";
import { index, text, uuid } from "drizzle-orm/pg-core";
import { timestamps, uuidv7 } from "../_helper";
import { pgSeoTable } from "../_table";
import { seoContentDraft } from "./content-draft-schema";
import { seoStrategyPhase } from "./strategy-phase-schema";

export const seoStrategyPhaseContent = pgSeoTable(
  "strategy_phase_content",
  {
    id: uuid().primaryKey().$defaultFn(uuidv7),
    phaseId: uuid()
      .notNull()
      .references(() => seoStrategyPhase.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    contentDraftId: uuid()
      .notNull()
      .references(() => seoContentDraft.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    action: text({ enum: CONTENT_STRATEGY_ACTION }).notNull(),
    ...timestamps,
  },
  (table) => [
    index("seo_strategy_phase_content_phase_idx").on(table.phaseId),
    index("seo_strategy_phase_content_draft_idx").on(table.contentDraftId),
  ],
);

export const seoStrategyPhaseContentRelations = relations(
  seoStrategyPhaseContent,
  ({ one }) => ({
    phase: one(seoStrategyPhase, {
      fields: [seoStrategyPhaseContent.phaseId],
      references: [seoStrategyPhase.id],
    }),
    contentDraft: one(seoContentDraft, {
      fields: [seoStrategyPhaseContent.contentDraftId],
      references: [seoContentDraft.id],
    }),
  }),
);

export const seoStrategyPhaseContentInsertSchema = createInsertSchema(
  seoStrategyPhaseContent,
).omit("id", "createdAt", "updatedAt", "deletedAt");
export const seoStrategyPhaseContentSelectSchema = createSelectSchema(
  seoStrategyPhaseContent,
);
export const seoStrategyPhaseContentUpdateSchema = createUpdateSchema(
  seoStrategyPhaseContent,
)
  .omit("createdAt", "updatedAt", "deletedAt")
  .merge(
    type({
      id: "string.uuid",
      phaseId: "string.uuid",
    }),
  );
