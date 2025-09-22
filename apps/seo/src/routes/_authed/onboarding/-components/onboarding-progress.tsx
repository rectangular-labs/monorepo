import { useSearch } from "@tanstack/react-router";
import { OnboardingSteps } from "../-lib/steps";

export function OnboardingProgress() {
  const matcher = OnboardingSteps.useStepper();
  const { type } = useSearch({
    from: "/_authed/onboarding/",
  });

  if (matcher.current.id === "welcome" || matcher.current.id === "all-set") {
    return null;
  }
  const relevantSteps = matcher.all.filter((step) => {
    if (type === "new-user") {
      return step.id !== "welcome" && step.id !== "all-set";
    }
    return (
      step.id !== "welcome" &&
      step.id !== "all-set" &&
      step.id !== "user-background" &&
      step.id !== "create-organization"
    );
  });
  const totalRelevantSteps = relevantSteps.length;
  const currentRelevantStepIndex = relevantSteps.findIndex(
    (step) => step.id === matcher.current.id,
  );

  return (
    <div className="w-full max-w-lg space-y-2 px-6">
      <p className="text-muted-foreground text-sm">
        Step {currentRelevantStepIndex + 1} of {totalRelevantSteps}
      </p>
      <div className="flex w-full items-center overflow-hidden rounded-full">
        {relevantSteps.map((step, index) => {
          const isCompleted = currentRelevantStepIndex > index;
          const isCurrent = currentRelevantStepIndex === index;
          return (
            <div
              className={`h-1 flex-1 ${
                isCompleted || isCurrent ? "bg-primary" : "bg-muted"
              } ${isCurrent ? "rounded-r-full" : ""}`}
              key={step.id}
            />
          );
        })}
      </div>
    </div>
  );
}
