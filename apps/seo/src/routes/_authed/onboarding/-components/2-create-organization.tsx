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

const backgroundSchema = type({
  name: type("string").atLeastLength(1),
});

function toSlug(input: string) {
  return (
    input
      .toLowerCase()
      .trim()
      // replace all non-alphanumeric characters with a hyphen
      .replace(/[^a-z0-9]+/g, "-")
      // replace any names starting with a hyphen or ending with a hyphen
      .replace(/^-+|-+$/g, "")
  );
}
export function OnboardingCreateOrganization() {
  const matcher = OnboardingSteps.useStepper();
  const form = useForm({
    resolver: arktypeResolver(backgroundSchema),
  });

  const handleSubmit = async (values: typeof backgroundSchema.infer) => {
    const slug = toSlug(values.name);
    const valid = await authClient.organization.checkSlug({
      slug,
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
        message: "Organization name already taken, please choose another one.",
      });
      return;
    }

    const organizationResult = await authClient.organization.create({
      name: values.name,
      slug,
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
          <CardTitle>Set Up Organization</CardTitle>
          <CardDescription>
            Your organization will let you manage team members and projects.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <CardContent>
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
