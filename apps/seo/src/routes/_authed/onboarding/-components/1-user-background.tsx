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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
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
import { useMetadata } from "../-lib/use-metadata";

const sourceOptions = [
  { value: "x", label: "X" },
  { value: "reddit", label: "Reddit" },
  { value: "hacker-news", label: "Hacker News" },
  { value: "other", label: "Other" },
];
const goalOptions = [
  { value: "sentiment", label: "Figuring out customer sentiment" },
  { value: "monitor", label: "Monitor conversation around a topic" },
  { value: "problems", label: "Find problems" },
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
  const { data: savedMetadata, set: setMetadata } =
    useMetadata("user-background");

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
      setMetadata(data);
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
        <Form {...form}>
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="source"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Where did you first hear about us?</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
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
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />

              {isOtherSource && (
                <FormField
                  control={form.control}
                  name="otherSource"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Source</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Times Magazine"
                          type="text"
                        />
                      </FormControl>

                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="goal"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Where would you want Mentions to help with the most?
                    </FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isOtherGoal && (
                <FormField
                  control={form.control}
                  name="otherGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Other Goal</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Finding Satoshi's private key"
                          type="text"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {form.formState.errors.root && (
                <FormMessage>{form.formState.errors.root.message}</FormMessage>
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
        </Form>
      </Card>
    </div>
  );
}
