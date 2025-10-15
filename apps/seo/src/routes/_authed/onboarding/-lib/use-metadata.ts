import type { ManageProjectFormValues } from "../../-components/manage-project-form";
import { type OnboardingStep, OnboardingSteps } from "./steps";

/**
 * Type-safe metadata for each onboarding step
 */
export interface OnboardingMetadata {
  welcome: Record<string, never>;
  "user-background": {
    source?: string;
    goal?: string;
    otherGoal?: string;
    otherSource?: string;
  };
  "create-organization": {
    organizationId?: string;
    organizationSlug?: string;
  };
  "website-info": {
    websiteUrl: string;
    taskId: string;
    projectId: string;
    organizationId: string;
  };
  "understanding-site": Partial<
    ManageProjectFormValues & {
      projectId: string;
      organizationId: string;
      websiteUrl: string;
    }
  >;
  "review-project": Record<string, never>;
  "connect-gsc": Record<string, never>;
  "connect-gsc-property": Record<string, never>;
  "all-set": Record<string, never>;
}

/**
 * Type-safe hook for getting and setting metadata for a specific step
 */
export function useMetadata<TStepId extends OnboardingStep>(
  stepId: TStepId,
): {
  data: OnboardingMetadata[TStepId] | undefined;
  set: (data: OnboardingMetadata[TStepId]) => void;
} {
  const stepper = OnboardingSteps.useStepper();

  return {
    data: stepper.getMetadata<OnboardingMetadata[TStepId]>(stepId),
    set: (data: OnboardingMetadata[TStepId]) => {
      stepper.setMetadata(stepId, data);
    },
  };
}
