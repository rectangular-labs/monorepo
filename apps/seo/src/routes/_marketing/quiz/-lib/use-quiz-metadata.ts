import { QuizSteps } from "./steps";

export type QuizState = {
  answers: { questionId: string; value: string }[];
  qualifying: {
    name?: string;
    email?: string;
    websiteUrl?: string;
    profile?: string;
    desired?: string;
    obstacle?: string;
    investedBefore?: string;
    notes?: string;
  };
};

// New consolidated state helpers
export function useQuizState() {
  const stepper = QuizSteps.useStepper();
  const data = stepper.getMetadata<QuizState>("state");
  const set = (next: QuizState) => {
    stepper.setMetadata("state", next);
  };
  return {
    data: data ?? ({ answers: [], qualifying: {} } as QuizState),
    set,
  } as const;
}
