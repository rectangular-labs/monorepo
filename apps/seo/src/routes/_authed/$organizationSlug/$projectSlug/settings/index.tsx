import {
  businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/core/schemas/project-parsers";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { X } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  useFieldArray,
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
      name: "",
      websiteUrl: "",
      version: "v1" as const,
      businessOverview: "",
      targetAudience: "",
      caseStudies: [],
      industry: "",
      targetCountryCode: "",
      targetCity: "",
      languageCode: "",
      competitorsWebsites: [],
    },
  });
  const resetForm = useCallback(() => {
    if (!activeProject) return;
    form.reset({
      name: activeProject.name || "",
      websiteUrl: activeProject.websiteUrl || "",
      version: "v1" as const,
      businessOverview:
        activeProject.businessBackground?.businessOverview || "",
      targetAudience: activeProject.businessBackground?.targetAudience || "",
      caseStudies: activeProject.businessBackground?.caseStudies || [],
      industry: activeProject.businessBackground?.industry || "",
      targetCountryCode:
        activeProject.businessBackground?.targetCountryCode || "",
      targetCity: activeProject.businessBackground?.targetCity || "",
      languageCode: activeProject.businessBackground?.languageCode || "",
      competitorsWebsites:
        activeProject.businessBackground?.competitorsWebsites || [],
    });
  }, [activeProject, form]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const {
    fields: competitorFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
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
        <form className="grid gap-6" onSubmit={form.handleSubmit(submitForm)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-name`}
                  >
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-name`}
                    placeholder="My First Project"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="websiteUrl"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-websiteUrl`}
                  >
                    Website URL
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-websiteUrl`}
                    placeholder="https://42.com"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="businessOverview"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-businessOverview`}
                  >
                    Business Overview
                  </FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-businessOverview`}
                    placeholder="What does your business do? The more detail, the better."
                    rows={5}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="targetAudience"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-targetAudience`}
                  >
                    Target Audience
                  </FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-targetAudience`}
                    placeholder="Who are you serving? Like business overview, the more detail here, the better!"
                    rows={5}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="industry"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-industry`}
                  >
                    Industry
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-industry`}
                    placeholder="e.g., SaaS, Healthcare, Retail"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="targetCountryCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-targetCountryCode`}
                  >
                    Target Country
                  </FieldLabel>
                  <FieldDescription>
                    The country where most of your audience is located.
                  </FieldDescription>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                      id={`business-background-${organizationSlug}-${projectSlug}-targetCountryCode`}
                    >
                      <SelectValue placeholder="Select a country" />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(COUNTRY_CODE_MAP).map((code) => (
                        <SelectItem key={code} value={code}>
                          {COUNTRY_CODE_MAP[code]}
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

            <Controller
              control={form.control}
              name="targetCity"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-targetCity`}
                  >
                    Primary City (optional)
                  </FieldLabel>
                  <FieldDescription>
                    If most of your audience is concentrated in a specific
                    city/metro. Leave blank if not applicable.
                  </FieldDescription>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-targetCity`}
                    placeholder="San Francisco"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="languageCode"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`business-background-${organizationSlug}-${projectSlug}-languageCode`}
                  >
                    Language Code
                  </FieldLabel>
                  <FieldDescription>
                    Two-letter ISO 639-1 language code for your audience.
                    Examples: en, es, de.
                  </FieldDescription>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`business-background-${organizationSlug}-${projectSlug}-languageCode`}
                    placeholder="en"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <FieldSet className="gap-3">
            <FieldLegend variant="label">Competitors Websites</FieldLegend>
            <FieldDescription>
              List URLs of direct competitors. Add as many as you like.
            </FieldDescription>
            <FieldGroup className="gap-3">
              {competitorFields.map((item, index) => (
                <Controller
                  control={form.control}
                  key={item.id}
                  name={`competitorsWebsites.${index}.url`}
                  render={({ field, fieldState }) => (
                    <Field
                      className="items-start"
                      data-invalid={fieldState.invalid}
                      orientation="horizontal"
                    >
                      <FieldLabel
                        className="sr-only"
                        htmlFor={`business-background-${organizationSlug}-${projectSlug}-competitorsWebsites-${index}`}
                      >
                        Competitor website {index + 1}
                      </FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id={`business-background-${organizationSlug}-${projectSlug}-competitorsWebsites-${index}`}
                        placeholder="https://competitor.com"
                      />
                      <Button
                        aria-label="Remove competitor website"
                        onClick={() => remove(index)}
                        size="icon"
                        type="button"
                        variant="ghost"
                      >
                        <X />
                      </Button>
                      {fieldState.invalid && (
                        <FieldError errors={[fieldState.error]} />
                      )}
                    </Field>
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
            </FieldGroup>
          </FieldSet>

          {form.formState.errors.root && (
            <FieldError errors={[form.formState.errors.root]} />
          )}
          <FloatingToolbar
            errors={formError}
            isSaving={isPending}
            isVisible={isDirty}
            onCancel={resetForm}
          />
        </form>
      </AutoHeight>
    </div>
  );
}
