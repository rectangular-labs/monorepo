import type { taskInputSchema } from "@rectangular-labs/db/parsers";
import { type RetrieveRunResult, runs, tasks } from "@trigger.dev/sdk";
import type { type } from "arktype";
import type { analyzeKeywordsTask } from "./trigger/analyze-keywords";
import type { understandSiteLlmTask } from "./trigger/understand-site-llm";

export * from "@trigger.dev/sdk";

export const triggerTask = (
  args: type.infer<typeof taskInputSchema>,
): Promise<{ id: string }> => {
  switch (args.type) {
    case "understand-site":
      return tasks.trigger<typeof understandSiteLlmTask>(
        "understand-site-llm",
        args,
      );
    case "analyze-keywords":
      return tasks.trigger<typeof analyzeKeywordsTask>(
        "analyze-keywords",
        args,
      );
    default: {
      const never: never = args;
      throw new Error(`Unknown task type: ${never}`);
    }
  }
};

export const getTask = async (
  taskId: string,
): Promise<
  RetrieveRunResult<typeof understandSiteLlmTask | typeof analyzeKeywordsTask>
> => {
  const run = await runs.retrieve<
    typeof understandSiteLlmTask | typeof analyzeKeywordsTask
  >(taskId);
  return run;
};
