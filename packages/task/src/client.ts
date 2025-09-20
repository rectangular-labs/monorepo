import { type RetrieveRunResult, runs, tasks } from "@trigger.dev/sdk";
import type { understandSiteTask } from "./trigger/understand-site";

export * from "@trigger.dev/sdk";

export const triggerUnderstandSiteTask = (
  siteUrl: string,
): Promise<{ id: string }> =>
  tasks.trigger<typeof understandSiteTask>("understand-site", {
    startUrl: siteUrl,
  });

export const getUnderstandSiteTask = (
  taskId: string,
): Promise<RetrieveRunResult<typeof understandSiteTask>> =>
  runs.retrieve<typeof understandSiteTask>(taskId);
