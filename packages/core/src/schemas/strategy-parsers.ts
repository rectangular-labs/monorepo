import { type } from "arktype";

export const strategyGoalSchema = type({
  metric: type("'conversions'|'clicks'|'impressions'|'avgPosition'").describe(
    "Primary KPI to optimize for: conversions (outcomes), clicks (traffic), impressions (visibility), avgPosition (rank).",
  ),
  target: type("number").describe(
    "Numeric goal for the chosen KPI (absolute count for conversions/clicks/impressions, or ranking position for avgPosition).",
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

export const strategyPhaseTypeSchema = type(
  "'build'|'optimize'|'expand'",
).describe("Strategy type that matches the strategy intent.");
export const contentStrategyActionSchema = type(
  "'create'|'improve'|'expand'",
).describe("Content action for a strategy phase.");
export const cadenceSchema = type({
  // "daily" => frequency is articles/day
  // "weekly" => frequency is articles/week
  // "monthly" => frequency is articles/month
  period: type("'daily' | 'weekly' | 'monthly'").describe(
    "Publishing cadence unit.",
  ),
  frequency: type("number.integer >= 1").describe(
    "Number of items published per period.",
  ),
  // Days that are eligible for publishing. Deselecting a day means we won't publish on that day.
  allowedDays: type("'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun'")
    .array()
    .describe("Eligible days for publishing."),
});
export const strategyPhaseSuggestionScheme = type({
  phase: type({
    type: strategyPhaseTypeSchema,
    name: type("string").describe("Short phase name."),
    observationWeeks: type("number").describe(
      "Number of weeks to observe results after execution.",
    ),
    successCriteria: type("string").describe(
      'Observable criteria that define phase success. Should be the "SMAR" part of a SMART goal',
    ),
    cadence: cadenceSchema.describe("The "),
  }).describe("Execution phase for the strategy."),
  contents: type({
    action: contentStrategyActionSchema.describe(
      "Action to take on the content item.",
    ),
    "plannedTitle?": type("string").describe(
      "Working title for the planned content item.",
    ),
    "plannedPrimaryKeyword?": type("string").describe(
      "Primary keyword targeted by the content item.",
    ),
    "role?": type("'pillar'|'supporting'").describe(
      "Content role within the cluster.",
    ),
    "notes?": type("string").describe(
      "Additional notes or constraints for the content item.",
    ),
  })
    .array()
    .describe("Planned content items for the strategy."),
});
export const STRATEGY_PHASE_TYPE = [
  "build",
  "optimize",
  "expand",
] as const satisfies (typeof strategyPhaseTypeSchema.infer)[];
export const STRATEGY_PHASE_STATUSES = [
  "suggestion",
  "planned",
  "in_progress",
  "observing",
  "completed",
  "dismissed",
] as const;

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

export type KeywordSnapshot = {
  keyword: string;
  position: number;
  clicks: number;
  impressions: number;
  volume: number | null;
};

export type SnapshotAggregate = {
  clicks: number;
  impressions: number;
  ctr: number;
  avgPosition: number;
  conversions: number | null;
};

export type SnapshotDelta = {
  clicks: number;
  impressions: number;
  avgPosition: number;
  conversions: number | null;
};
