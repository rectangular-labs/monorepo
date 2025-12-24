import type { StopCondition, ToolSet } from "ai";

export const hasAnswer: StopCondition<ToolSet> = ({ steps }) => {
  steps[0]?.toolCalls;

  // Stop when the model generates text containing "ANSWER:"
  return steps.some((step) => step.text?.includes("ANSWER:")) ?? false;
};
