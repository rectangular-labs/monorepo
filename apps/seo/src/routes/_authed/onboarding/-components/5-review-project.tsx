import { toSlug } from "@rectangular-labs/core/format/to-slug";
import {
  businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/core/schemas/project-parsers";
import { X } from "@rectangular-labs/ui/components/icon";
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
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { type } from "arktype";
import { getApiClientRq } from "~/lib/api";
import { OnboardingSteps } from "../-lib/steps";
import { useMetadata } from "../-lib/use-metadata";

const formSchema = type({
  name: type("string")
    .atLeastLength(1)
    .configure({ message: () => "Name is required" }),
}).merge(businessBackgroundSchema.omit("version"));
type ReviewProjectFormValues = typeof formSchema.infer;

export function OnboardingReviewProject() {
  const matcher = OnboardingSteps.useStepper();
  const navigate = useNavigate();
  const { data: defaultValues } = useMetadata("understanding-site");

  const { mutateAsync: updateProject, isPending } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: (data) => {
        void navigate({
          to: "/onboarding",
          search: (prev) => ({
            ...prev,
            projectId: data.id,
            organizationId: data.organizationId,
          }),
        });
        matcher.next();
      },
    }),
  );

  const form = useForm<ReviewProjectFormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: "",
      caseStudies: defaultValues?.caseStudies || [],
      businessOverview: defaultValues?.businessOverview || "",
      targetAudience: defaultValues?.targetAudience || "",
      targetCountryCode: defaultValues?.targetCountryCode || "",
      targetCity: defaultValues?.targetCity || "",
      industry: defaultValues?.industry || "",
      languageCode: defaultValues?.languageCode || "",
      competitorsWebsites: defaultValues?.competitorsWebsites || [],
    },
  });

  const {
    fields: competitorFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
  });

  const handleSubmit = async (values: ReviewProjectFormValues) => {
    if (!defaultValues?.projectId || !defaultValues?.organizationId) {
      return;
    }
    if (!defaultValues.websiteUrl) {
      form.setError("root", {
        message: "Missing website URL. Please go back.",
      });
      return;
    }
    const slug = toSlug(values.name);
    await updateProject({
      id: defaultValues.projectId,
      organizationIdentifier: defaultValues.organizationId,
      websiteUrl: defaultValues.websiteUrl,
      name: values.name,
      slug,
      businessBackground: {
        version: "v1",
        businessOverview: values.businessOverview,
        targetAudience: values.targetAudience,
        caseStudies: values.caseStudies,
        competitorsWebsites: values.competitorsWebsites,
        industry: values.industry,
        languageCode: values.languageCode,
        targetCountryCode: values.targetCountryCode,
        targetCity: values.targetCity,
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
        <form className="grid gap-6" onSubmit={form.handleSubmit(handleSubmit)}>
          <CardContent className="grid max-h-[60vh] gap-6 overflow-y-auto px-6">
            <FieldGroup>
              <Controller
                control={form.control}
                name="name"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-review-project-name">
                      Project name
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-name"
                      placeholder="My First Project"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Field>
                <FieldLabel htmlFor="onboarding-review-project-websiteUrl">
                  Website URL
                </FieldLabel>
                <Input
                  disabled
                  id="onboarding-review-project-websiteUrl"
                  readOnly
                  value={defaultValues?.websiteUrl ?? ""}
                />
              </Field>

              <Controller
                control={form.control}
                name="industry"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-review-project-industry">
                      Industry
                    </FieldLabel>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-industry"
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
                    <FieldLabel htmlFor="onboarding-review-project-targetCountryCode">
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
                        id="onboarding-review-project-targetCountryCode"
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
                    <FieldLabel htmlFor="onboarding-review-project-targetCity">
                      Primary City (optional)
                    </FieldLabel>
                    <FieldDescription>
                      If most of your audience is concentrated in a specific
                      city/metro. Leave blank if not applicable.
                    </FieldDescription>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-targetCity"
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
                    <FieldLabel htmlFor="onboarding-review-project-languageCode">
                      Language Code
                    </FieldLabel>
                    <FieldDescription>
                      Two-letter ISO 639-1 language code for your audience.
                      Examples: en, es, de.
                    </FieldDescription>
                    <Input
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-languageCode"
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
                          htmlFor={`onboarding-review-project-competitorsWebsites-${index}`}
                        >
                          Competitor website {index + 1}
                        </FieldLabel>
                        <Input
                          {...field}
                          aria-invalid={fieldState.invalid}
                          id={`onboarding-review-project-competitorsWebsites-${index}`}
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

            <FieldGroup>
              <Controller
                control={form.control}
                name="businessOverview"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="onboarding-review-project-businessOverview">
                      Business Overview
                    </FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-businessOverview"
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
                    <FieldLabel htmlFor="onboarding-review-project-targetAudience">
                      Target Audience
                    </FieldLabel>
                    <Textarea
                      {...field}
                      aria-invalid={fieldState.invalid}
                      id="onboarding-review-project-targetAudience"
                      placeholder="Who are you serving? Like business overview, the more detail here, the better!"
                      rows={5}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>

            {form.formState.errors.root && (
              <FieldError errors={[form.formState.errors.root]} />
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
      </Card>
    </div>
  );
}
