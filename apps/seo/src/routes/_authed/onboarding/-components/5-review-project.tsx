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
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { apiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";
import { toSlug } from "../-lib/to-slug";

const formSchema = type({
  projectId: type("string.uuid"),
  name: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Name is required",
    }),
  websiteUrl: type("string.url")
    .atLeastLength(1)
    .configure({
      message: () => "Must be a valid URL",
    }),
  businessOverview: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Business Overview is required",
    }),
  idealCustomer: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Ideal Customer is required",
    }),
  serviceRegion: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Service Region is required",
    }),
  industry: type("string")
    .atLeastLength(1)
    .configure({
      message: () => "Industry is required",
    }),
});

export function OnboardingReviewProject() {
  const matcher = OnboardingSteps.useStepper();

  const defaultValues =
    matcher.getMetadata<
      Partial<typeof formSchema.infer & { projectId: string }>
    >("understanding-site");
  const form = useForm({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      projectId: defaultValues?.projectId || "",
      name: defaultValues?.name || "",
      websiteUrl: defaultValues?.websiteUrl || "",
      businessOverview: defaultValues?.businessOverview || "",
      idealCustomer: defaultValues?.idealCustomer || "",
      serviceRegion: defaultValues?.serviceRegion || "",
      industry: defaultValues?.industry || "",
    },
  });

  const { mutate: updateProject, isPending } = useMutation(
    apiClientRq.projects.update.mutationOptions({
      onSuccess: (data) => {
        matcher.setMetadata("review-project", {
          slug: data.slug,
          name: data.name,
        });
        matcher.next();
      },
      onError: () => {
        form.setError("root", {
          message: "Failed to update project. Please try again later.",
        });
      },
    }),
  );

  const handleSubmit = (values: typeof formSchema.infer) => {
    const slug = toSlug(values.name);
    updateProject({
      id: values.projectId,
      websiteUrl: values.websiteUrl,
      name: values.name,
      slug,
      websiteInfo: {
        version: "v1",
        businessOverview: values.businessOverview,
        idealCustomer: values.idealCustomer,
        serviceRegion: values.serviceRegion,
        industry: values.industry,
      },
    });
  };

  return (
    <div className="mx-auto flex w-full max-w-lg flex-col justify-center space-y-6">
      <Card className="rounded-none sm:rounded-lg">
        <CardHeader>
          <CardTitle>{matcher.current.title}</CardTitle>
          <CardDescription>{matcher.current.description}</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <CardContent className="grid max-h-[60vh] gap-6 overflow-y-auto">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="My First Project" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="websiteUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Website URL</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="https://42.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="serviceRegion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Region</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., Global, US-only, EU"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="industry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Industry</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="e.g., SaaS, Healthcare, Retail"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="businessOverview"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Overview</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="What does your business do? The more detail, the better."
                        rows={5}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="idealCustomer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ideal Customer</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Who are you serving? Like business overview, the more detail here, the better!"
                        rows={5}
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
                <Button className={"w-fit"} isLoading={isPending} type="submit">
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
