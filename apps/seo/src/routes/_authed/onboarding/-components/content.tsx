import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { OnboardingSteps } from "../-lib/steps";
import { OnboardingWelcome } from "./0-welcome";
import { OnboardingUserBackground } from "./1-user-background";
import { OnboardingCreateOrganization } from "./2-create-organization";
import { OnboardingWebsiteInfo } from "./3-website-info";
import { OnboardingUnderstandingSite } from "./4-understanding-site";
import { OnboardingReviewProject } from "./5-review-project";
import { OnboardingAllSet } from "./6-all-set";
import { OnboardingConnectGsc } from "./connect-gsc";
import { OnboardingConnectGscProperty } from "./connect-gsc-property";
import { OnboardingProgress } from "./onboarding-progress";

export function OnboardingContent() {
  const matcher = OnboardingSteps.useStepper();

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-lg flex-col items-center justify-center gap-6 py-6">
      <OnboardingProgress />
      <AutoHeight
        className="w-full"
        contentId={matcher.current.id}
        transition={{
          ease: [0, 0, 0.28, 1],
          duration: 0.2,
        }}
      >
        {matcher.switch({
          welcome: (step) => (
            <OnboardingWelcome
              description={step.description}
              title={step.title}
            />
          ),
          "user-background": (step) => (
            <OnboardingUserBackground
              description={step.description}
              title={step.title}
            />
          ),
          "create-organization": () => <OnboardingCreateOrganization />,
          "website-info": (step) => (
            <OnboardingWebsiteInfo
              description={step.description}
              title={step.title}
            />
          ),
          "connect-gsc": (step) => (
            <OnboardingConnectGsc
              description={step.description}
              title={step.title}
            />
          ),
          "connect-gsc-property": (step) => (
            <OnboardingConnectGscProperty
              description={step.description}
              title={step.title}
            />
          ),
          "understanding-site": (step) => (
            <OnboardingUnderstandingSite
              description={step.description}
              title={step.title}
            />
          ),
          "review-project": () => <OnboardingReviewProject />,
          "all-set": (step) => (
            <OnboardingAllSet
              description={step.description}
              title={step.title}
            />
          ),
        })}
      </AutoHeight>
    </div>
  );
}
