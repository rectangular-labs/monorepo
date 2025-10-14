import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@rectangular-labs/ui/components/ui/radio-group";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { allSteps } from "../-lib/steps";
import { useQuizState } from "../-lib/use-quiz-metadata";

export function QualifyingStep({ stepId }: { stepId: string }) {
  const { data: state, set } = useQuizState();

  const found = allSteps.find((s) => s.id === stepId);
  if (!found || found.kind !== "qualifying") return null;
  const step = found;

  const value = (state.qualifying as Record<string, unknown>)[step.field] ?? "";

  function setValue(nextValue: string) {
    const next = {
      ...state,
      qualifying: { ...state.qualifying, [step.field]: nextValue },
    };
    set(next);
  }

  return (
    <div className="grid gap-6">
      {step.inputType === "radio" ? (
        <div className="grid gap-3">
          <Label>{step.description}</Label>
          <RadioGroup onValueChange={(v) => setValue(v)} value={String(value)}>
            {step.options.map((opt: (typeof step.options)[number]) => (
              <div className="flex items-center gap-3" key={String(opt.value)}>
                <RadioGroupItem
                  id={`${step.id}-${String(opt.value)}`}
                  value={String(opt.value)}
                />
                <Label htmlFor={`${step.id}-${String(opt.value)}`}>
                  {opt.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>
      ) : step.inputType === "textarea" ? (
        <div className="grid gap-2">
          <Label>{step.description}</Label>
          <Textarea
            onChange={(e) => setValue(e.target.value)}
            value={String(value)}
          />
        </div>
      ) : (
        <div className="grid gap-2">
          <Label>{step.description}</Label>
          <Input
            onChange={(e) => setValue(e.target.value)}
            type={step.inputType}
            value={String(value)}
          />
        </div>
      )}
    </div>
  );
}
