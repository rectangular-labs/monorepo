import type { StepResult, ToolSet } from "ai";

type LogFn = (message: string, data?: Record<string, unknown>) => void;

export function logAgentStep<T extends ToolSet>(
  log: LogFn,
  message: string,
  step: StepResult<T>,
  id?: string,
) {
  log(message, {
    id,
    toolResults: JSON.stringify(
      step.toolResults.map((result) => {
        if (!result) return undefined;
        return {
          toolName: result.toolName,
          input: result.input,
          output: result.output,
        };
      }),
    ),
    usage: step.usage,
  });
}
