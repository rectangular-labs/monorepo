import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import { Progress } from "@rectangular-labs/ui/components/ui/progress";
import { Section } from "@rectangular-labs/ui/components/ui/section";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChoiceStep } from "./-components/ChoiceStep";
import { QualifyingStep } from "./-components/QualifyingStep";
import type { QuizStep } from "./-lib/steps";
import { allSteps, QuizSteps } from "./-lib/steps";
import { useQuizState } from "./-lib/use-quiz-metadata";

// quizMeta imported

export const Route = createFileRoute("/_marketing/quiz/")({
  component: QuizPage,
});

function QuizPage() {
  return (
    <QuizSteps.Scoped>
      <Section>
        <div className="container mx-auto">
          <QuizForm />
        </div>
      </Section>
    </QuizSteps.Scoped>
  );
}

function QuizForm() {
  const matcher = QuizSteps.useStepper();
  const navigate = useNavigate();
  const { data: state } = useQuizState();

  const map: Partial<Record<QuizStep, React.ReactNode>> = {
    "mobile-speed": <ChoiceStep stepId="mobile-speed" />,
    "mobile-friendly": <ChoiceStep stepId="mobile-friendly" />,
    indexation: <ChoiceStep stepId="indexation" />,
    "titles-meta": <ChoiceStep stepId="titles-meta" />,
    "keyword-mapping": <ChoiceStep stepId="keyword-mapping" />,
    cadence: <ChoiceStep stepId="cadence" />,
    depth: <ChoiceStep stepId="depth" />,
    "ref-domains": <ChoiceStep stepId="ref-domains" />,
    "internal-links": <ChoiceStep stepId="internal-links" />,
    analytics: <ChoiceStep stepId="analytics" />,
    "qual-name": <QualifyingStep stepId="qual-name" />,
    "qual-email": <QualifyingStep stepId="qual-email" />,
    "qual-website": <QualifyingStep stepId="qual-website" />,
    "qual-profile": <QualifyingStep stepId="qual-profile" />,
    "qual-desired": <QualifyingStep stepId="qual-desired" />,
    "qual-obstacle": <QualifyingStep stepId="qual-obstacle" />,
    "qual-invested": <QualifyingStep stepId="qual-invested" />,
    "qual-notes": <QualifyingStep stepId="qual-notes" />,
  };
  const Current = map[matcher.current.id as QuizStep];
  if (!Current) return null;

  const currentIndex = allSteps.findIndex((s) => s.id === matcher.current.id);
  const totalSteps = allSteps.length;
  const progressValue = Math.round(((currentIndex + 1) / totalSteps) * 100);

  const stepConfig = allSteps[currentIndex];

  const canNext = (() => {
    if (!stepConfig) return false;
    if (stepConfig.kind === "choice") {
      const selected = state.answers.find(
        (a) => a.questionId === stepConfig.question.id,
      )?.value;
      return Boolean(selected);
    }
    if (stepConfig.kind === "qualifying") {
      const value = (state.qualifying as Record<string, unknown>)[
        stepConfig.field
      ];
      const isOptional = stepConfig.field === "notes";
      return isOptional ? true : Boolean(value);
    }
    return true;
  })();

  function onNext() {
    const isLast = currentIndex === totalSteps - 1;
    if (isLast) {
      try {
        sessionStorage.setItem("seo-quiz-v1", JSON.stringify(state));
      } catch {
        // Ignore persistence failures (e.g., storage disabled)
      }
      void navigate({ to: "/quiz/results" });
    } else {
      matcher.next();
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <div className="grid gap-3">
        <Progress value={progressValue} />
        <div className="text-muted-foreground text-sm">
          Step {currentIndex + 1} of {totalSteps}
        </div>
      </div>
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>{stepConfig?.title}</CardTitle>
        </CardHeader>
        <CardContent>{Current}</CardContent>
        <CardFooter>
          <div className="flex w-full justify-between">
            {!matcher.isFirst && (
              <Button
                onClick={() => matcher.prev()}
                type="button"
                variant="ghost"
              >
                Back
              </Button>
            )}
            <Button
              className="ml-auto"
              disabled={!canNext}
              onClick={onNext}
              type="button"
            >
              {currentIndex === totalSteps - 1 ? "See my results" : "Next"}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
