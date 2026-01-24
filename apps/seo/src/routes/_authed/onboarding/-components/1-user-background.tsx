import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { authClient } from "~/lib/auth";
import { OnboardingSteps } from "../-lib/steps";

const sourceOptions = [
  { value: "x", label: "X" },
  { value: "reddit", label: "Reddit" },
  { value: "google", label: "Google" },
  { value: "hacker-news", label: "Hacker News" },
  { value: "ai-conversations", label: "AI conversations" },
  { value: "other", label: "Other" },
];
const goalOptions = [
  { value: "brand-authority", label: "Increase brand authority" },
  { value: "traffic", label: "Increase site traffic" },
  { value: "leads", label: "Get more leads" },
  { value: "other", label: "Other" },
];

const backgroundSchema = type({
  source: type.string
    .atLeastLength(1)
    .configure({ message: () => "Source must not be blank" }),
  "otherSource?": "string",
  goal: type.string
    .atLeastLength(1)
    .configure({ message: () => "Goal must not be blank" }),
  "otherGoal?": "string",
}).narrow((data, ctx) => {
  if (data.source === "other" && !data.otherSource) {
    return ctx.reject({
      path: ["otherSource"],
      message: "Source must not be blank",
    });
  }
  if (data.goal === "other" && !data.otherGoal) {
    return ctx.reject({
      path: ["otherGoal"],
      message: "Goal must not be blank",
    });
  }
  return true;
});

export function OnboardingUserBackground({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const matcher = OnboardingSteps.useStepper();
  const savedMetadata =
    matcher.getMetadata<Partial<typeof backgroundSchema.infer>>(
      "user-background",
    );

  const form = useForm({
    resolver: arktypeResolver(backgroundSchema),
    defaultValues: {
      source: savedMetadata?.source ?? "",
      goal: savedMetadata?.goal ?? "",
      otherGoal: savedMetadata?.otherGoal ?? "",
      otherSource: savedMetadata?.otherSource ?? "",
    },
  });
  const isOtherSource = form.watch("source") === "other";
  const isOtherGoal = form.watch("goal") === "other";

  const { mutate: updateUser, isPending } = useMutation({
    mutationFn: async (values: typeof backgroundSchema.infer) => {
      const source =
        values.source === "other" ? values.otherSource : values.source;
      const goal = values.goal === "other" ? values.otherGoal : values.goal;
      const updatedUser = await authClient.updateUser({
        source,
        goal,
      });
      if (updatedUser.error) {
        throw new Error(updatedUser.error.message);
      }
      return values;
    },
    onSuccess: (data) => {
      matcher.setMetadata("user-background", data);
      matcher.next();
    },
  });

  const handleSubmit = (values: typeof backgroundSchema.infer) => {
    updateUser(values);
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="grid gap-6">
            <FieldGroup>
              <Controller
                control={form.control}
                name="source"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-user-background-source">
                      Where did you first hear about us?
                    </FieldLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                        id="onboarding-user-background-source"
                      >
                        <SelectValue placeholder="Source" />
                      </SelectTrigger>
                      <SelectContent>
                        {sourceOptions.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {isOtherSource && (
                <Controller
                  control={form.control}
                  name="otherSource"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="onboarding-user-background-otherSource">
                        Other Source
                      </FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="onboarding-user-background-otherSource"
                        placeholder="Times Magazine"
                        type="text"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}

              <Controller
                control={form.control}
                name="goal"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-user-background-goal">
                      Where would you want Fluid Posts to help with the most?
                    </FieldLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger
                        aria-invalid={fieldState.invalid}
                        className="w-full"
                        id="onboarding-user-background-goal"
                      >
                        <SelectValue placeholder="goals" />
                      </SelectTrigger>
                      <SelectContent>
                        {goalOptions.map((k) => (
                          <SelectItem key={k.value} value={k.value}>
                            {k.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {isOtherGoal && (
                <Controller
                  control={form.control}
                  name="otherGoal"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="onboarding-user-background-otherGoal">
                        Other Goal
                      </FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id="onboarding-user-background-otherGoal"
                        placeholder="Finding Satoshi's private key"
                        type="text"
                      />
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
                  )}
                />
              )}
            </FieldGroup>

            {form.formState.errors.root && (
              <FieldError errors={[form.formState.errors.root]} />
            )}
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-between">
              <Button
                disabled={isPending}
                onClick={() => matcher.prev()}
                type="button"
                variant="ghost"
              >
                Back
              </Button>
              <Button className={"w-fit"} isLoading={isPending} type="submit">
                Next
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
