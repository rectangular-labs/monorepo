import { type } from "arktype";

export const strategyGoalSchema = type({
  metric: type("'clicks'|'impressions'|'avgPosition'").describe(
    "Primary KPI to optimize for: clicks (traffic), impressions (visibility), avgPosition (rank).",
  ),
  target: type("number").describe(
    "Numeric goal for the chosen KPI (absolute count for clicks/impressions, or ranking position for avgPosition).",
  ),
  timeframe: type("'monthly'|'total'").describe(
    "Whether the target is expected per month or cumulative across the full strategy duration.",
  ),
}).describe(
  "Target metric for a strategy. Example aggressive SEO goal: { metric: 'clicks', target: 120000, timeframe: 'monthly' }.",
);

export const STRATEGY_STATUSES = [
  "suggestion",
  "active",
  "observing",
  "stable",
  "archived",
  "dismissed",
] as const;

export const strategySuggestionSchema = type({
  name: type("string").describe("Short, clear strategy name."),
  motivation: type("string").describe(
    "Why this strategy matters right now, grounded in research or data.",
  ),
  "description?": type("string").describe(
    "Concise description of what will be executed and how it works.",
  ),
  goal: strategyGoalSchema.describe(
    "Primary success metric, target value, and timeframe. Should follow the SMART Goal setting",
  ),
}).describe("Single strategy suggestion.");

export const cadencePeriodSchema = type("'daily' | 'weekly' | 'monthly'");
export const weekdaySchema = type(
  "'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'",
);
export const cadenceSchema = type({
  // "daily" => frequency is articles/day
  // "weekly" => frequency is articles/week
  // "monthly" => frequency is articles/month
  period: cadencePeriodSchema
    .describe("Publishing cadence unit.")
    .default("weekly"),
  frequency: type("number.integer >= 1")
    .describe("Number of items published per period.")
    .default(3),
  // Days that are eligible for publishing. Deselecting a day means we won't publish on that day.
  allowedDays: weekdaySchema
    .array()
    .describe(
      "Eligible days for publishing. By default prefer mon through fri for publishing",
    )
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
    updatedRole: contentRoleSchema.describe(
      "Updated role for the content item based on the data. If not provided, the existing role will be used.",
    ),
    "updatedTitle?": type("string").describe(
      "Updated SEO optimized title for the content item based on the data. If not provided, the existing title will be used.",
    ),
    "updatedDescription?": type("string").describe(
      "Updated SEO optimized description for the content item based on the data. If not provided, the existing description will be used.",
    ),
    "updatedPrimaryKeyword?": type("string").describe(
      "Updated primary keyword for the content item based on the data. If not provided, the existing primary keyword will be used.",
    ),
    "updatedNotes?": type("string").describe(
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
    "notes?": type("string").describe(
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
