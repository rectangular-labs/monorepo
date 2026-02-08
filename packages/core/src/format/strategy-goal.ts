import type { strategyGoalSchema } from "../schemas/strategy-parsers";

export function formatStrategyGoal(goal: typeof strategyGoalSchema.infer) {
  const metricLabel =
    goal.metric === "avgPosition" ? "avg position" : goal.metric;
  const timeframeLabel = goal.timeframe === "monthly" ? "per month" : "total";

  return `${goal.target} ${metricLabel} ${timeframeLabel}`;
}
