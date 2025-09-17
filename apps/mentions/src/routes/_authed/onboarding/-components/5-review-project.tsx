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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { type } from "arktype";
import { authClient } from "~/lib/auth/client";
import { OnboardingSteps } from "../-lib/steps";

const schema = type({
  name: "string.alphanumeric",
  description: "string",
  targetAudience: "string",
  suggestedKeywords: "string[]",
  responseTone: "string",
});
export function OnboardingReviewProject() {
  const matcher = OnboardingSteps.useStepper();
  const form = useForm({
    resolver: arktypeResolver(schema),
  });

  const handleSubmit = async (values: typeof schema.infer) => {
    const valid = await authClient.organization.checkSlug({
      slug: values.name,
    });
    if (valid.error) {
      form.setError("root", {
        message:
          valid.error.message ??
          "Something went wrong creating the organization. Please try again later",
      });
      return;
    }
    if (!valid.data?.status) {
      form.setError("name", {
        message: "Organization name already taken, please choose another one!",
      });
      return;
    }

    const organizationResult = await authClient.organization.create({
      name: values.name,
      slug: values.name,
      metadata: { description: values.description },
    });
    if (organizationResult.error) {
      form.setError("root", {
        message:
          organizationResult.error.message ||
          organizationResult.error.statusText,
      });
      return;
    }
    matcher.next();
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{matcher.current.title}</CardTitle>
          <CardDescription>{matcher.current.description}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Xerox" />
                    </FormControl>
                    <FormMessage>
                      <FormDescription>
                        You will be able to change this at anytime later on
                      </FormDescription>
                    </FormMessage>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Organization Description{" "}
                      <span className="text-muted-foreground">(optional)</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="We invented the mice"
                        type="text"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root && (
                <FormMessage>{form.formState.errors.root.message}</FormMessage>
              )}
            </CardContent>
            <CardFooter>
              <div className="flex w-full justify-between">
                <Button
                  onClick={() => matcher.prev()}
                  type="button"
                  variant="ghost"
                >
                  Back
                </Button>
                <Button className={"w-fit"} type="submit">
                  Continue
                </Button>
              </div>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
