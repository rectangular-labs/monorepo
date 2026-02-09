import {
  cadencePeriodSchema,
  weekdaySchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffect } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { FloatingToolbar } from "./-components/floating-toolbar";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/publishing-settings",
)({
  component: PublishingSettingsPage,
});

type Weekday = typeof weekdaySchema.infer;

type PublishingSettings =
  typeof import("@rectangular-labs/core/schemas/project-parsers").publishingSettingsSchema.infer;

const formSchema = type({
  period: cadencePeriodSchema,
  frequency: "number.integer >= 1",
  allowedDays: weekdaySchema.array(),
  requireContentReview: "boolean",
  requireSuggestionReview: "boolean",
});
type PublishingSettingsFormValues = typeof formSchema.infer;

function PublishingSettingsPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();

  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery(
    getApiClientRq().project.getPublishingSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const form = useForm<PublishingSettingsFormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      period: "weekly",
      frequency: 1,
      allowedDays: ["mon"],
      requireContentReview: true,
      requireSuggestionReview: true,
    },
  });

  const resetForm = useCallback(() => {
    if (!project) return;

    const current = project.publishingSettings ?? {
      version: "v1" as const,
      cadence: {
        period: "weekly" as const,
        frequency: 1,
        allowedDays: ["mon"],
      },
      requireContentReview: true,
      requireSuggestionReview: true,
    };

    form.reset({
      period: current.cadence.period,
      frequency: current.cadence.frequency,
      allowedDays: current.cadence.allowedDays ?? [],
      requireContentReview: current.requireContentReview,
      requireSuggestionReview: current.requireSuggestionReview,
    });
  }, [form, project]);

  useEffect(() => {
    resetForm();
  }, [resetForm]);

  const { mutate: updateProject, isPending } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onError: (e) => {
        form.setError("root", { message: e.message });
      },
      onSuccess: async () => {
        toast.success("Publishing settings updated");
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getPublishingSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  const isDirty = form.formState.isDirty;
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: isDirty,
  });

  function handleSave(values: PublishingSettingsFormValues) {
    if (!project) return;
    if (
      (values.period === "daily" ||
        values.period === "weekly" ||
        values.period === "monthly") &&
      values.allowedDays.length === 0
    ) {
      form.setError("allowedDays", {
        message: "Select at least one allowed day.",
      });
      return;
    }

    const publishingSettings = {
      version: "v1",
      cadence: {
        period: values.period,
        frequency: values.frequency,
        allowedDays: values.allowedDays,
      },
      requireContentReview: values.requireContentReview,
      requireSuggestionReview: values.requireSuggestionReview,
    } satisfies PublishingSettings;

    updateProject({
      id: project.id,
      organizationIdentifier: organizationSlug,
      publishingSettings,
    });
  }

  if (!project || isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading the publishing settings. Please try again."
        errorTitle="Error loading publishing settings"
        isLoading={isLoading}
        onRetry={refetch}
      />
    );
  }

  const period = form.watch("period");
  const frequency = form.watch("frequency");
  const allowedDays = form.watch("allowedDays");
  const allowedDaysCount = allowedDays.length;
  const maxPerDay =
    allowedDaysCount > 0
      ? period === "daily"
        ? frequency
        : Math.ceil(frequency / allowedDaysCount)
      : 0;

  const days: { value: Weekday; label: string }[] = [
    { value: "mon", label: "Mon" },
    { value: "tue", label: "Tue" },
    { value: "wed", label: "Wed" },
    { value: "thu", label: "Thu" },
    { value: "fri", label: "Fri" },
    { value: "sat", label: "Sat" },
    { value: "sun", label: "Sun" },
  ];

  return (
    <form
      className="relative w-full space-y-6"
      onSubmit={form.handleSubmit(handleSave)}
    >
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Publishing</h1>
        <p className="text-muted-foreground">
          Control cadence and review gates for articles.
        </p>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="period"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="publishing-settings-frequency">
                Period
              </FieldLabel>
              <FieldDescription>
                The unit your publishing frequency is measured in.
              </FieldDescription>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <SelectTrigger
                  aria-invalid={fieldState.invalid}
                  className="w-full"
                  id="publishing-settings-frequency"
                >
                  <SelectValue placeholder="Select cadence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="frequency"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="publishing-settings-frequency-count">
                Frequency
              </FieldLabel>
              <FieldDescription>
                {period === "daily"
                  ? "How many articles to publish per allowed day."
                  : period === "weekly"
                    ? "How many articles to publish per week."
                    : "How many articles to publish per month."}{" "}
                {allowedDaysCount > 0 && Number.isFinite(maxPerDay) && (
                  <span className="text-muted-foreground">
                    (Max {maxPerDay} per allowed day)
                  </span>
                )}
              </FieldDescription>
              <Input
                aria-invalid={fieldState.invalid}
                id="publishing-settings-frequency-count"
                inputMode="numeric"
                min={1}
                onChange={(e) => {
                  const next = e.target.valueAsNumber;
                  field.onChange(Number.isFinite(next) ? next : 1);
                }}
                step={1}
                type="number"
                value={field.value}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="allowedDays"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel>Allowed days</FieldLabel>
              <FieldDescription>
                Deselecting a day means we won&apos;t publish on that day.
              </FieldDescription>
              <div className="flex flex-wrap gap-3 pt-1">
                {days.map((d) => {
                  const id = `publishing-settings-day-${d.value}`;
                  const checked = field.value.includes(d.value);
                  return (
                    <div className="flex items-center gap-2" key={d.value}>
                      <Checkbox
                        checked={checked}
                        id={id}
                        onCheckedChange={(next) => {
                          const isChecked = next === true;
                          const nextValue = isChecked
                            ? Array.from(new Set([...field.value, d.value]))
                            : field.value.filter((v) => v !== d.value);
                          field.onChange(nextValue);
                        }}
                      />
                      <Label className="cursor-pointer" htmlFor={id}>
                        {d.label}
                      </Label>
                    </div>
                  );
                })}
              </div>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <FieldGroup>
        <Controller
          control={form.control}
          name="requireSuggestionReview"
          render={({ field }) => {
            const id = "publishing-settings-requireSuggestionReview";
            return (
              <Field>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={field.value}
                    id={id}
                    onCheckedChange={(next) => field.onChange(next === true)}
                  />
                  <div className="space-y-1">
                    <Label className="cursor-pointer" htmlFor={id}>
                      Require suggestion review
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Suggestions must be explicitly accepted before becoming
                      queued.
                    </p>
                  </div>
                </div>
              </Field>
            );
          }}
        />

        <Controller
          control={form.control}
          name="requireContentReview"
          render={({ field }) => {
            const id = "publishing-settings-requireContentReview";
            return (
              <Field>
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={field.value}
                    id={id}
                    onCheckedChange={(next) => field.onChange(next === true)}
                  />
                  <div className="space-y-1">
                    <Label className="cursor-pointer" htmlFor={id}>
                      Require content review before scheduling
                    </Label>
                    <p className="text-muted-foreground text-sm">
                      Generated articles must be approved before they can be
                      scheduled.
                    </p>
                  </div>
                </div>
              </Field>
            );
          }}
        />
      </FieldGroup>

      {form.formState.errors.root && (
        <FieldError errors={[form.formState.errors.root]} />
      )}

      <FloatingToolbar
        errors={form.formState.errors.root?.message}
        isSaving={isPending}
        isVisible={isDirty}
        onCancel={resetForm}
      />
    </form>
  );
}
