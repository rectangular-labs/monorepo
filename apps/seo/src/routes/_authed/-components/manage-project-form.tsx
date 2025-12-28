import {
  businessBackgroundSchema,
  COUNTRY_CODE_MAP,
} from "@rectangular-labs/core/schemas/project-parsers";
import { safe } from "@rectangular-labs/result";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { X } from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  CardContent,
  CardFooter,
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
  type UseFormReturn,
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
import { cn } from "@rectangular-labs/ui/utils/cn";
import { type } from "arktype";
import { type ReactNode, useCallback, useEffect } from "react";

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
}).merge(businessBackgroundSchema.omit("version"));
export type ManageProjectFormValues = typeof formSchema.infer;

export interface ManageProjectFormRef {
  form: UseFormReturn<ManageProjectFormValues>;
  isDirty: boolean;
  resetForm: () => void;
}

export function ManageProjectForm({
  defaultValues,
  onSubmit,
  children,
  className,
}: {
  defaultValues?: Partial<ManageProjectFormValues>;
  onSubmit: (values: ManageProjectFormValues) => void | Promise<void>;
  className?: string;
  children?: ReactNode;
}) {
  const form = useForm({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: defaultValues?.name || "",
      websiteUrl: defaultValues?.websiteUrl || "",
      businessOverview: defaultValues?.businessOverview || "",
      targetAudience: defaultValues?.targetAudience || "",
      targetCountryCode: defaultValues?.targetCountryCode || "",
      targetCity: defaultValues?.targetCity || "",
      industry: defaultValues?.industry || "",
      languageCode: defaultValues?.languageCode || "",
      competitorsWebsites: defaultValues?.competitorsWebsites || [],
    },
  });

  const resetForm = useCallback(() => {
    if (!defaultValues) return;
    form.reset({
      name: defaultValues.name || "",
      websiteUrl: defaultValues.websiteUrl || "",
      businessOverview: defaultValues.businessOverview || "",
      targetAudience: defaultValues.targetAudience || "",
      targetCountryCode: defaultValues.targetCountryCode || "",
      targetCity: defaultValues.targetCity || "",
      industry: defaultValues.industry || "",
      languageCode: defaultValues.languageCode || "",
      competitorsWebsites: defaultValues.competitorsWebsites || [],
    });
  }, [defaultValues, form]);

  useEffect(() => {
    if (defaultValues) {
      resetForm();
    }
  }, [defaultValues, resetForm]);

  const {
    fields: competitorFields,
    append,
    remove,
  } = useFieldArray({
    control: form.control,
    name: "competitorsWebsites",
  });

  const submitForm = async (values: ManageProjectFormValues) => {
    const result = await safe(() => Promise.resolve(onSubmit(values)));
    if (!result.ok) {
      form.setError("root", {
        message: result.error.message,
      });
    }
  };

  return (
    <AutoHeight contentId={`manage-project-form`}>
      <form className="grid gap-6" onSubmit={form.handleSubmit(submitForm)}>
        <CardContent className={cn("grid gap-6 px-0", className)}>
          <FieldGroup>
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="manage-project-form-name">
                    Name
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-name"
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
                  <FieldLabel htmlFor="manage-project-form-websiteUrl">
                    Website URL
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-websiteUrl"
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
              name="industry"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="manage-project-form-industry">
                    Industry
                  </FieldLabel>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-industry"
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
                  <FieldLabel htmlFor="manage-project-form-targetCountryCode">
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
                      id="manage-project-form-targetCountryCode"
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
                  <FieldLabel htmlFor="manage-project-form-targetCity">
                    Primary City (optional)
                  </FieldLabel>
                  <FieldDescription>
                    If most of your audience is concentrated in a specific
                    city/metro. Leave blank if not applicable.
                  </FieldDescription>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-targetCity"
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
                  <FieldLabel htmlFor="manage-project-form-languageCode">
                    Language Code
                  </FieldLabel>
                  <FieldDescription>
                    Two-letter ISO 639-1 language code for your audience.
                    Examples: en, es, de.
                  </FieldDescription>
                  <Input
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-languageCode"
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
                        htmlFor={`manage-project-form-competitorsWebsites-${index}`}
                      >
                        Competitor website {index + 1}
                      </FieldLabel>
                      <Input
                        {...field}
                        aria-invalid={fieldState.invalid}
                        id={`manage-project-form-competitorsWebsites-${index}`}
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
                  <FieldLabel htmlFor="manage-project-form-businessOverview">
                    Business Overview
                  </FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-businessOverview"
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
                  <FieldLabel htmlFor="manage-project-form-targetAudience">
                    Target Audience
                  </FieldLabel>
                  <Textarea
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id="manage-project-form-targetAudience"
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
        {children && <CardFooter className="px-0">{children}</CardFooter>}
      </form>
    </AutoHeight>
  );
}
