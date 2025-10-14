import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@rectangular-labs/ui/components/ui/radio-group";
import { allSteps } from "../-lib/steps";
import { useQuizState } from "../-lib/use-quiz-metadata";

export function ChoiceStep({ stepId }: { stepId: string }) {
  const { data: state, set } = useQuizState();

  const step = allSteps.find(
    (s): s is Extract<(typeof allSteps)[number], { kind: "choice" }> =>
      s.id === stepId && s.kind === "choice",
  );
  if (!step) return null;
  const q = step.question;

  const selected =
    state.answers.find((a) => a.questionId === q.id)?.value ?? "";

  function setAnswer(value: string) {
    const next = {
      ...state,
      answers: [
        ...state.answers.filter((a) => a.questionId !== q.id),
        { questionId: q.id, value },
      ],
    };
    set(next);
  }
  return (
    <div className="grid gap-3">
      <Label className="font-semibold leading-none">{q.label}</Label>
      <RadioGroup onValueChange={setAnswer} value={selected}>
        {q.options.map((opt: (typeof q.options)[number]) => (
          <div className="flex items-center gap-3" key={opt.value}>
            <RadioGroupItem id={`${q.id}-${opt.value}`} value={opt.value} />
            <Label htmlFor={`${q.id}-${opt.value}`}>{opt.label}</Label>
          </div>
        ))}
      </RadioGroup>
    </div>
  );
}
