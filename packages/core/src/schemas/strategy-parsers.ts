import { type } from "arktype";

import {
  strategyKeywordUniverseDraftSchema,
  strategyLlmQueriesDraftSchema,
} from "./keyword-parsers";

export const strategyGoalSchema = type({
  metric: type("'clicks'|'impressions'|'avgPosition'"),
  target: type("number"),
  timeframe: type("'monthly'|'total'"),
});

export const STRATEGY_STATUSES = [
  "suggestion",
  "active",
  "observing",
  "stable",
  "archived",
  "dismissed",
] as const;

const strategyBaseSchema = type({
  name: type("string"),
  motivation: type("string"),
  goal: strategyGoalSchema,
});

export const strategySuggestionSchema = type({
  "...": strategyBaseSchema,
  keywordUniverse: strategyKeywordUniverseDraftSchema,
  llmQueries: strategyLlmQueriesDraftSchema,
});

export const strategyEditableSchema = strategyBaseSchema;

export const strategyKeywordClusterFormSchema = type({
  clusterId: "string",
  coreKeyword: "string",
  supportingKeywords: type({
    value: "string",
  }).array(),
});

export const strategyLlmQueryFormSchema = type({
  query: "string",
});

export const strategyManageFormSchema = type({
  "...": strategyEditableSchema,
  keywordClusters: strategyKeywordClusterFormSchema.array(),
  llmQueries: strategyLlmQueryFormSchema.array(),
});

export const cadencePeriodSchema = type("'daily' | 'weekly' | 'monthly'");
export const weekdaySchema = type(
  "'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'",
);
export const cadenceSchema = type({
  // "daily" => frequency is articles/day
  // "weekly" => frequency is articles/week
  // "monthly" => frequency is articles/month
  period: cadencePeriodSchema.default("weekly"),
  frequency: type("number.integer >= 1").default(3),
  // Days that are eligible for publishing. Deselecting a day means we won't publish on that day.
  allowedDays: weekdaySchema
    .describe("Eligible days for publishing.")
    .array()

    .default(() => ["mon", "tue", "wed", "thu", "fri"] as const),
});

export type PublishingCadence = typeof cadenceSchema.infer;

export const strategyPhaseTypeSchema = type(
  "'build'|'optimize'|'expand'",
).describe(
  "Strategy phase type. Build refers to creating new content. Optimize refers to improving existing content through tweaks and alterations to things like headings, internal links, and metadata. Expand refers to expanding on existing content to include new sections and subtopics. If a phase is to do both optimize and expansion of content, simply choose the one that best represents the primary focus of the phase.",
);

const contentRoleSchema = type("'pillar'|'supporting'");
export const contentStrategyActionSchema = type("'create'|'improve'|'expand'");
export const strategyPhaseSuggestionScheme = type({
  phase: type({
    type: strategyPhaseTypeSchema,
    name: type("string")
      .atLeastLength(1)
      .atMostLength(140)
      .describe("A short descriptive name for the phase."),
    observationWeeks: type("number").describe(
      "Number of weeks to observe results after execution.",
    ),
    successCriteria: type("string").describe(
      'Observable criteria that define phase success. Should be the "SMAR" part of a SMART goal',
    ),
    cadence: cadenceSchema.describe(
      "The 'T' part of a SMART goal. Defines the publishing cadence of the content items in this phase.",
    ),
  }).describe("Execution phase for the strategy."),
  contentUpdates: type({
    action: contentStrategyActionSchema
      .extract("'improve'|'expand'")
      .describe(
        "The main action for the content we are updating. Improve refers to improving existing content through tweaks and alterations to things like headings, internal links, and metadata. Expand refers to expanding on existing content to include new sections and subtopics. If a content item is to be both improved and expanded, choose 'expand'.",
      ),
    contentDraftId: type("string.uuid").describe(
      "Existing draft to improve/expand.",
    ),
    updatedRole: contentRoleSchema
      .or(type.null)
      .describe(
        "Updated role for the content item based on the data. If not provided, the existing role will be used.",
      ),
    updatedTitle: type("string|null").describe(
      "Updated SEO optimized title for the content item based on the data. If not provided, the existing title will be used.",
    ),
    updatedDescription: type("string|null").describe(
      "Updated SEO optimized description for the content item based on the data. If not provided, the existing description will be used.",
    ),
    updatedPrimaryKeyword: type("string|null").describe(
      "Updated primary keyword for the content item based on the data. If not provided, the existing primary keyword will be used.",
    ),
    updatedNotes: type("string|null").describe(
      "Notes on what we want to improve or expand on. This could be anything from adding new sections and subtopics, to improving the content based on the data, to adding new internal links. If we need to tweak anything in the content of the article, make sure to include notes here.",
    ),
  })
    .array()
    .describe("Content items to update."),
  contentCreations: type({
    action: contentStrategyActionSchema
      .extract("'create'")
      .describe("For content creation, the action is always 'create'"),
    role: contentRoleSchema.describe("Content role within the cluster."),
    plannedSlug: type("string").describe(
      "SEO optimized slug for the planned content item.",
    ),
    plannedPrimaryKeyword: type("string").describe(
      "Primary keyword targeted by the content item.",
    ),
    notes: type("string|null").describe(
      "Additional notes or constraints for the content item when we get to writing the content.",
    ),
  })
    .array()
    .describe("Content items to create."),
});

export const STRATEGY_PHASE_TYPE = [
  "build",
  "optimize",
  "expand",
] as const satisfies (typeof strategyPhaseTypeSchema.infer)[];
export const strategyPhaseStatusSchema = type(
  "'suggestion'|'planned'|'in_progress'|'observing'|'completed'|'dismissed'",
);
export type StrategyPhaseStatus = typeof strategyPhaseStatusSchema.infer;
export const STRATEGY_PHASE_STATUSES = [
  "suggestion",
  "planned",
  "in_progress",
  "observing",
  "completed",
  "dismissed",
] as const satisfies StrategyPhaseStatus[];

export const CONTENT_STRATEGY_ACTION = [
  "create",
  "improve",
  "expand",
] as const satisfies (typeof contentStrategyActionSchema.infer)[];
export const CONTENT_ROLES = ["pillar", "supporting"] as const;

export const STRATEGY_SNAPSHOT_TRIGGERS = [
  "scheduled",
  "phase_complete",
  "manual",
] as const;

export const keywordSnapshotSchema = type({
  keyword: "string",
  position: "number",
  clicks: "number",
  impressions: "number",
});
export type KeywordSnapshot = typeof keywordSnapshotSchema.infer;

export const snapshotAggregateSchema = type({
  clicks: "number",
  impressions: "number",
  avgPosition: "number",
  // conversions: number | null;
});
export type SnapshotAggregate = typeof snapshotAggregateSchema.infer;
