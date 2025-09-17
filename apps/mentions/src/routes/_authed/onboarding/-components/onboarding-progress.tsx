import { OnboardingSteps } from "../-lib/steps";

export function OnboardingProgress() {
  const matcher = OnboardingSteps.useStepper();

  if (matcher.current.id === "welcome" || matcher.current.id === "all-set") {
    return null;
  }
  const relevantSteps = matcher.all.filter(
    (step) => step.id !== "welcome" && step.id !== "all-set",
  );
  const totalRelevantSteps = relevantSteps.length;
  const currentRelevantStepIndex = relevantSteps.findIndex(
    (step) => step.id === matcher.current.id,
  );

  return (
    <div className="w-full max-w-lg space-y-2">
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
