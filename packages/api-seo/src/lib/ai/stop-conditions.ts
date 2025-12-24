import type { StopCondition, ToolSet } from "ai";

export function hasAnswer<T extends ToolSet>(): StopCondition<T> {
  return ({ steps }) => {
    // Stop when the model generates text containing "ANSWER:"
    return steps.some((step) => step.text?.includes("ANSWER:")) ?? false;
  };
}

export function stopWhenToolCalled<T extends ToolSet>(
  toolName: string,
): StopCondition<T> {
  return ({ steps }) => {
    // Stop when the tool is called
    return steps.some((step) =>
      step.toolCalls?.some((call) => call.toolName === toolName),
    );
  };
}
