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
import { type } from "arktype";
import { OnboardingSteps } from "../-lib/steps";

const formSchema = type({
  websiteUrl: type("string.url").configure({
    message: () => "Must be a valid URL",
  }),
}).merge(
  type({
    businessOverview: type("string").configure({
      message: () => "Business Overview is required",
    }),
    idealCustomer: type("string").configure({
      message: () => "Ideal Customer is required",
    }),
    serviceRegion: type("string").configure({
      message: () => "Service Region is required",
    }),
    industry: type("string").configure({
      message: () => "Industry is required",
    }),
  }),
);
export function OnboardingReviewProject() {
  const matcher = OnboardingSteps.useStepper();

  const defaultValues =
    matcher.getMetadata<Partial<typeof formSchema.infer>>("understanding-site");

  const form = useForm({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      websiteUrl: defaultValues?.websiteUrl || "",
      businessOverview: defaultValues?.businessOverview || "",
      idealCustomer: defaultValues?.idealCustomer || "",
      serviceRegion: defaultValues?.serviceRegion || "",
      industry: defaultValues?.industry || "",
    },
  });

  const handleSubmit = (_values: typeof formSchema.infer) => {
    // TODO: Persist to API once endpoint exists. For now, proceed.
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
          <form
            className="grid gap-6"
            onSubmit={form.handleSubmit(handleSubmit)}
          >
            <CardContent className="grid gap-6">
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
                        rows={3}
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
                        rows={3}
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
