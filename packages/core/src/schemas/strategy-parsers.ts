import { type } from "arktype";

export const strategyGoalSchema = type({
  metric: "'conversions'|'clicks'|'impressions'|'avgPosition'",
  target: "number",
  timeframe: "'monthly'|'total'",
}).describe("Target metric for a strategy.");

export const strategyStatuses = [
  "suggestion",
  "active",
  "observing",
  "stable",
  "archived",
  "dismissed",
] as const;

export const strategyPhaseTypes = ["build", "optimize", "expand"] as const;
export const strategyPhaseStatuses = [
  "suggestion",
  "planned",
  "in_progress",
  "observing",
  "completed",
  "dismissed",
] as const;
export const contentStrategyPhaseActions = [
  "create",
  "improve",
  "expand",
] as const;
export const contentStrategyPhaseRoles = ["pillar", "supporting"] as const;

export const strategySnapshotTriggers = [
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
