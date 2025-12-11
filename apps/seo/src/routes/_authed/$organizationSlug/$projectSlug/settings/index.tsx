import {
  businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/db/parsers";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { X } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFieldArray,
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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffect } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { FloatingToolbar } from "./-components/floating-toolbar";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/",
)({
  component: BusinessBackgroundForm,
});

const formSchema = type({
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
}).merge(businessBackgroundSchema);
type ManageProjectFormValues = typeof formSchema.infer;

function BusinessBackgroundForm() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: activeProject,
    isLoading,
    error,
    refetch,
  } = useQuery(
    getApiClientRq().project.getBusinessBackground.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const { mutate: updateProject, isPending } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
      onSuccess: async () => {
        toast.success("Business background updated");
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getBusinessBackground.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  const form = useForm({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: activeProject?.name || "",
      websiteUrl: activeProject?.websiteUrl || "",
      version: "v1" as const,
      businessOverview:
        activeProject?.businessBackground?.businessOverview || "",
      targetAudience: activeProject?.businessBackground?.targetAudience || "",
      caseStudies: activeProject?.businessBackground?.caseStudies || [],
      industry: activeProject?.businessBackground?.industry || "",
      serviceRegion: activeProject?.businessBackground?.serviceRegion || "",
      targetCountryCode:
        activeProject?.businessBackground?.targetCountryCode || "",
      targetCity: activeProject?.businessBackground?.targetCity || "",
      languageCode: activeProject?.businessBackground?.languageCode || "",
      competitorsWebsites:
        activeProject?.businessBackground?.competitorsWebsites || [],
    },
  });
  const resetForm = useCallback(() => {
    if (!activeProject) return;
    form.reset();
  }, [activeProject, form]);

  useEffect(() => {
    if (activeProject) {
      resetForm();
    }
  }, [activeProject, resetForm]);

  const {
    fields: competitorFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
    keyName: "url",
  });

  const submitForm = (values: ManageProjectFormValues) => {
    if (!activeProject) {
      return;
    }
    updateProject({
      id: activeProject.id,
      organizationIdentifier: activeProject.organizationId,
      businessBackground: {
        version: values.version,
        businessOverview: values.businessOverview,
        targetAudience: values.targetAudience,
        caseStudies: values.caseStudies,
        competitorsWebsites: values.competitorsWebsites,
        industry: values.industry,
        languageCode: values.languageCode,
        serviceRegion: values.serviceRegion,
        targetCountryCode: values.targetCountryCode,
        targetCity: values.targetCity,
      },
      websiteUrl: values.websiteUrl,
      name: values.name,
    });
  };

  const isDirty = form.formState.isDirty;
  const formError = form.formState.errors.root?.message;
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: isDirty,
  });

  if (!activeProject || isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading the project details. Please try again."
        errorTitle="Error loading project"
        isLoading={isLoading}
        onRetry={refetch}
      />
    );
  }

  return (
    <div className="relative w-full space-y-6">
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">
          Business Background
        </h1>
        <p className="text-muted-foreground">
          Tell us about your business and audience.
        </p>
      </div>
      <AutoHeight contentId={`manage-project-form`}>
        <Form {...form}>
          <form className="grid gap-6" onSubmit={form.handleSubmit(submitForm)}>
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
              name="targetAudience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Audience</FormLabel>
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
              name="serviceRegion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Region</FormLabel>
                  <FormDescription>
                    Where you serve customers. This is your overall footprint
                    (e.g., Global; EU; US; City, ST; list of countries). For the
                    primary country used for defaults like search locale, use
                    Target Country Code below.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="e.g., Global, US-only, EU" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCountryCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Country</FormLabel>
                  <FormDescription>
                    The country where most of your audience is located.
                  </FormDescription>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a country" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {Object.keys(COUNTRY_CODE_MAP).map((code) => (
                        <SelectItem key={code} value={code}>
                          {COUNTRY_CODE_MAP[code]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="targetCity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Primary City (optional)</FormLabel>
                  <FormDescription>
                    If most of your audience is concentrated in a specific
                    city/metro. Leave blank if not applicable.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="San Francisco" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="languageCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Language Code</FormLabel>
                  <FormDescription>
                    Two-letter ISO 639-1 language code for your audience.
                    Examples: en, es, de.
                  </FormDescription>
                  <FormControl>
                    <Input {...field} placeholder="en" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormItem>
              <FormLabel>Competitors Websites</FormLabel>
              <FormDescription>
                List URLs of direct competitors. Add as many as you like.
              </FormDescription>
              <div className="grid gap-3">
                {competitorFields.map((item, index) => (
                  <FormField
                    control={form.control}
                    key={item.url}
                    name={`competitorsWebsites.${index}`}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-start gap-2">
                          <FormControl>
                            <Input
                              {...field}
                              onChange={(e) => {
                                field.onChange({ url: e.target.value });
                              }}
                              placeholder="https://competitor.com"
                              value={field.value.url}
                            />
                          </FormControl>
                          <Button
                            aria-label="Remove competitor website"
                            onClick={() => remove(index)}
                            size="icon"
                            type="button"
                            variant="ghost"
                          >
                            <X />
                          </Button>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ))}
                <div className="flex justify-end">
                  <Button
                    onClick={() => append({ url: "" })}
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    Add competitor website
                  </Button>
                </div>
              </div>
            </FormItem>

            {form.formState.errors.root && (
              <FormMessage>{form.formState.errors.root.message}</FormMessage>
            )}
            <FloatingToolbar
              errors={formError}
              isSaving={isPending}
              isVisible={isDirty}
              onCancel={resetForm}
            />
          </form>
        </Form>
      </AutoHeight>
    </div>
  );
}
