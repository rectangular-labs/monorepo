import { env as cloudflareEnv } from "cloudflare:workers";
import type { SeoOnboardingWorkflowBinding } from "./onboarding-workflow";
import type { SeoPlannerWorkflowBinding } from "./planner-workflow";
import type { SeoStrategyPhaseGenerationWorkflowBinding } from "./strategy-phase-generation-workflow";
import type { SeoStrategySnapshotWorkflowBinding } from "./strategy-snapshot-workflow";
import type { SeoStrategySuggestionsWorkflowBinding } from "./strategy-suggestions-workflow";
import type { SeoWriterWorkflowBinding } from "./writer-workflow";

export const createWorkflows = () => {
  const castEnv = cloudflareEnv as {
    SEO_PLANNER_WORKFLOW: SeoPlannerWorkflowBinding;
    SEO_WRITER_WORKFLOW: SeoWriterWorkflowBinding;
    SEO_ONBOARDING_WORKFLOW: SeoOnboardingWorkflowBinding;
    SEO_STRATEGY_SUGGESTIONS_WORKFLOW: SeoStrategySuggestionsWorkflowBinding;
    SEO_STRATEGY_PHASE_GENERATION_WORKFLOW: SeoStrategyPhaseGenerationWorkflowBinding;
    SEO_STRATEGY_SNAPSHOT_WORKFLOW: SeoStrategySnapshotWorkflowBinding;
  };
  return {
    seoPlannerWorkflow: castEnv.SEO_PLANNER_WORKFLOW,
    seoWriterWorkflow: castEnv.SEO_WRITER_WORKFLOW,
    seoOnboardingWorkflow: castEnv.SEO_ONBOARDING_WORKFLOW,
    seoStrategySuggestionsWorkflow: castEnv.SEO_STRATEGY_SUGGESTIONS_WORKFLOW,
    seoStrategyPhaseGenerationWorkflow:
      castEnv.SEO_STRATEGY_PHASE_GENERATION_WORKFLOW,
    seoStrategySnapshotWorkflow: castEnv.SEO_STRATEGY_SNAPSHOT_WORKFLOW,
  };
};
export { SeoOnboardingWorkflow } from "./onboarding-workflow";
export { SeoPlannerWorkflow } from "./planner-workflow";
export { SeoStrategyPhaseGenerationWorkflow } from "./strategy-phase-generation-workflow";
export { SeoStrategySnapshotWorkflow } from "./strategy-snapshot-workflow";
export { SeoStrategySuggestionsWorkflow } from "./strategy-suggestions-workflow";
export { SeoWriterWorkflow } from "./writer-workflow";
