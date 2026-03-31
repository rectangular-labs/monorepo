import { env as cloudflareEnv } from "cloudflare:workers";
import type { SeoOnboardingWorkflowBinding } from "./onboarding-workflow";
import type { SeoStrategyDraftPlanningWorkflowBinding } from "./strategy-draft-planning-workflow";
import type { SeoStrategySnapshotWorkflowBinding } from "./strategy-snapshot-workflow";
import type { SeoStrategySuggestionsWorkflowBinding } from "./strategy-suggestions-workflow";
import type { SeoWriterWorkflowBinding } from "./writer-workflow";

export const createWorkflows = () => {
  const castEnv = cloudflareEnv as {
    SEO_WRITER_WORKFLOW: SeoWriterWorkflowBinding;
    SEO_ONBOARDING_WORKFLOW: SeoOnboardingWorkflowBinding;
    SEO_STRATEGY_SUGGESTIONS_WORKFLOW: SeoStrategySuggestionsWorkflowBinding;
    SEO_STRATEGY_DRAFT_PLANNING_WORKFLOW: SeoStrategyDraftPlanningWorkflowBinding;
    SEO_STRATEGY_SNAPSHOT_WORKFLOW: SeoStrategySnapshotWorkflowBinding;
  };
  return {
    seoWriterWorkflow: castEnv.SEO_WRITER_WORKFLOW,
    seoOnboardingWorkflow: castEnv.SEO_ONBOARDING_WORKFLOW,
    seoStrategySuggestionsWorkflow: castEnv.SEO_STRATEGY_SUGGESTIONS_WORKFLOW,
    seoStrategyDraftPlanningWorkflow:
      castEnv.SEO_STRATEGY_DRAFT_PLANNING_WORKFLOW,
    seoStrategySnapshotWorkflow: castEnv.SEO_STRATEGY_SNAPSHOT_WORKFLOW,
  };
};
export { SeoOnboardingWorkflow } from "./onboarding-workflow";
export { SeoStrategyDraftPlanningWorkflow } from "./strategy-draft-planning-workflow";
export { SeoStrategySnapshotWorkflow } from "./strategy-snapshot-workflow";
export { SeoStrategySuggestionsWorkflow } from "./strategy-suggestions-workflow";
export { SeoWriterWorkflow } from "./writer-workflow";
