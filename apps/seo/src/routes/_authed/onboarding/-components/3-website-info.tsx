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
import { useMutation, useQuery } from "@tanstack/react-query";
import { useSearch } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";
import { useMetadata } from "../-lib/use-metadata";

const backgroundSchema = type({
  url: type("string.url").configure({ message: () => "Must be a valid URL" }),
});

export function OnboardingWebsiteInfo({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  const matcher = OnboardingSteps.useStepper();
  const { type, projectId, organizationId } = useSearch({
    from: "/_authed/onboarding/",
  });
  const { data, set: setMetadata } = useMetadata("website-info");
  const { data: project } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        identifier: projectId ?? "",
        organizationIdentifier: organizationId ?? "",
      },
      enabled: !!projectId && !!organizationId,
    }),
  );

  const form = useForm({
    resolver: arktypeResolver(backgroundSchema),
    defaultValues: {
      url: data?.websiteUrl ?? project?.websiteUrl ?? "",
    },
  });

  const { mutate: createProject, isPending } = useMutation(
    getApiClientRq().project.create.mutationOptions({
      onSuccess: (data, { websiteUrl }) => {
        setMetadata({
          websiteUrl,
          taskId: data.taskId,
          projectId: data.id,
          organizationId: data.organizationId,
        });
        matcher.next();
      },
      onError: (error) => {
        form.setError("root", {
          message: error.message,
        });
      },
    }),
  );

  const handleSubmit = async (values: typeof backgroundSchema.infer) => {
    const organization = await getApiClient().auth.organization.active();
    if (!organization) {
      form.setError("root", {
        message: "No active organization found",
      });
      return;
    }
    createProject({
      websiteUrl: values.url,
      organizationIdentifier: organization.id,
    });
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
            <CardContent>
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        autoComplete="url"
                        placeholder="https://42.com"
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
                {type === "new-user" && (
                  <Button
                    disabled={isPending}
                    onClick={() => matcher.prev()}
                    type="button"
                    variant="ghost"
                  >
                    Back
                  </Button>
                )}
                <Button
                  className={"ml-auto w-fit"}
                  isLoading={isPending}
                  type="submit"
                >
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
