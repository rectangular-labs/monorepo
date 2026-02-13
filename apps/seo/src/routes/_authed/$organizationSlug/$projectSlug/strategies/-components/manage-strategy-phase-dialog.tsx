"use client";

import type {
  RouterInputs,
  RouterOutputs,
} from "@rectangular-labs/api-seo/types";
import {
  cadencePeriodSchema,
  type PublishingCadence,
  type StrategyPhaseStatus,
  weekdaySchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { computePhaseTargetCompletionDate } from "@rectangular-labs/core/strategy/compute-phase-target-completion-date";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  DialogDrawer,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
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
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import { getApiClientRq } from "~/lib/api";
import { isoToDatetimeLocalValue } from "~/lib/datetime-local";

const phaseFormSchema = type({
  name: "string >= 1",
  status:
    "'suggestion'|'planned'|'in_progress'|'observing'|'completed'|'dismissed'",
  successCriteria: "string >= 1",
  targetCompletionDate: "string",
  cadence: type({
    period: cadencePeriodSchema,
    frequency: "number.integer >= 1",
    allowedDays: weekdaySchema.array(),
  }),
  observationWeeks: "number.integer >= 0",
});

type PhaseFormValues = typeof phaseFormSchema.infer;
type StrategyPhase = RouterOutputs["strategy"]["get"]["phases"][number];
type StrategyPhaseContent = StrategyPhase["phaseContents"][number];

type Weekday = PublishingCadence["allowedDays"][number];
const days: { value: Weekday; label: string }[] = [
  { value: "mon", label: "Mon" },
  { value: "tue", label: "Tue" },
  { value: "wed", label: "Wed" },
  { value: "thu", label: "Thu" },
  { value: "fri", label: "Fri" },
  { value: "sat", label: "Sat" },
  { value: "sun", label: "Sun" },
];

const phaseStatusOptions = [
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In progress" },
  { value: "observing", label: "Observing" },
  { value: "completed", label: "Completed" },
  { value: "dismissed", label: "Dismissed" },
  { value: "suggestion", label: "Suggestion" },
] as const satisfies { value: StrategyPhaseStatus; label: string }[];

export function ManageStrategyPhaseDialog({
  phase,
  organizationId,
  projectId,
  open,
  onOpenChange,
}: {
  phase: StrategyPhase | null;
  organizationId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const defaultValues = useMemo<PhaseFormValues>(
    () => ({
      name: phase?.name ?? "",
      status: phase?.status ?? "planned",
      successCriteria: phase?.successCriteria ?? "",
      targetCompletionDate: phase?.targetCompletionDate
        ? isoToDatetimeLocalValue(phase.targetCompletionDate.toISOString())
        : "",
      cadence: {
        period: phase?.cadence.period ?? "weekly",
        frequency: phase?.cadence.frequency ?? 1,
        allowedDays: phase?.cadence.allowedDays ?? ["mon"],
      },
      observationWeeks: phase?.observationWeeks ?? 0,
    }),
    [phase],
  );

  const form = useForm<PhaseFormValues>({
    resolver: arktypeResolver(phaseFormSchema),
    defaultValues,
  });
  const cadencePeriod = form.watch("cadence.period");
  const cadenceFrequency = form.watch("cadence.frequency");
  const cadenceAllowedDays = form.watch("cadence.allowedDays");
  const status = form.watch("status");

  const phaseContentCounts = useMemo(() => {
    if (!phase) {
      return { creations: 0, updates: 0 };
    }

    return phase.phaseContents.reduce(
      (counts, content: StrategyPhaseContent) => {
        if (content.action === "create") {
          counts.creations += 1;
        } else if (
          content.action === "improve" ||
          content.action === "expand"
        ) {
          counts.updates += 1;
        }
        return counts;
      },
      { creations: 0, updates: 0 },
    );
  }, [phase]);

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  useEffect(() => {
    if (!open || !phase) return;

    const nextTargetCompletionDate = computePhaseTargetCompletionDate({
      phaseStatus: status,
      cadence: {
        period: cadencePeriod,
        frequency: cadenceFrequency,
        allowedDays: cadenceAllowedDays,
      },
      contentCreationsCount: phaseContentCounts.creations,
      contentUpdatesCount: phaseContentCounts.updates,
      now: new Date(),
    });
    const nextValue = nextTargetCompletionDate
      ? isoToDatetimeLocalValue(nextTargetCompletionDate.toISOString())
      : "";
    const currentValue = form.getValues("targetCompletionDate") ?? "";

    if (nextValue !== currentValue) {
      form.setValue("targetCompletionDate", nextValue, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [
    cadenceAllowedDays,
    cadenceFrequency,
    cadencePeriod,
    form,
    open,
    phase,
    phaseContentCounts.creations,
    phaseContentCounts.updates,
    status,
  ]);

  const { mutate: updatePhase, isPending } = useMutation(
    api.strategy.phases.update.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
      onSuccess: async () => {
        toast.success("Phase updated");
        onOpenChange(false);
        if (!phase) return;

        await queryClient.invalidateQueries({
          queryKey: api.strategy.get.queryKey({
            input: {
              organizationIdentifier: organizationId,
              projectId,
              id: phase.strategyId,
            },
          }),
        });
      },
    }),
  );

  const submitForm = (values: PhaseFormValues) => {
    if (!phase) return;

    if (values.cadence.allowedDays.length === 0) {
      form.setError("cadence.allowedDays", {
        message: "Select at least one cadence day.",
      });
      return;
    }

    const payload: RouterInputs["strategy"]["phases"]["update"] = {
      organizationIdentifier: organizationId,
      projectId,
      id: phase.id,
      strategyId: phase.strategyId,
      name: values.name.trim(),
      status: values.status,
      successCriteria: values.successCriteria.trim(),
      targetCompletionDate: values.targetCompletionDate
        ? new Date(values.targetCompletionDate)
        : null,
      cadence: {
        period: values.cadence.period,
        frequency: values.cadence.frequency,
        allowedDays: values.cadence.allowedDays,
      },
      observationWeeks: values.observationWeeks,
    };

    updatePhase(payload);
  };

  const fieldPrefix = phase ? `phase-manage-${phase.id}` : "phase-manage-new";
  const formError = form.formState.errors.root?.message;
  const title = phase ? "Edit phase" : "Phase";
  const submitLabel = phase ? "Save changes" : "Save";

  return (
    <DialogDrawer
      className="sm:max-w-2xl"
      isLoading={isPending}
      onOpenChange={onOpenChange}
      open={open}
    >
      <DialogDrawerHeader>
        <DialogDrawerTitle>{title}</DialogDrawerTitle>
      </DialogDrawerHeader>

      <form
        className="grid max-h-[70vh] gap-6 overflow-y-auto"
        id="phase-manage-form"
        onSubmit={form.handleSubmit(submitForm)}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-name`}>Title</FieldLabel>
                <Input
                  {...field}
                  id={`${fieldPrefix}-name`}
                  placeholder="Phase title"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="status"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-status`}>
                  Status
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={`${fieldPrefix}-status`}>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {phaseStatusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
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
            name="successCriteria"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-success-criteria`}>
                  Success criteria
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${fieldPrefix}-success-criteria`}
                  placeholder="How do we know this phase is successful?"
                  rows={4}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="observationWeeks"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-observation-weeks`}>
                  Observation weeks
                </FieldLabel>
                <Input
                  id={`${fieldPrefix}-observation-weeks`}
                  min={0}
                  onChange={(event) => {
                    const next = event.currentTarget.valueAsNumber;
                    field.onChange(Number.isFinite(next) ? next : 0);
                  }}
                  step={1}
                  type="number"
                  value={field.value}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldGroup>

        <FieldSet className="gap-3">
          <FieldLegend variant="label">Cadence</FieldLegend>
          <FieldDescription>
            Set how often this phase should ship content. Target completion date
            is automatically set to the end of the last content piece.
          </FieldDescription>

          <div className="grid gap-4 md:grid-cols-2">
            <Controller
              control={form.control}
              name="cadence.frequency"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${fieldPrefix}-cadence-frequency`}>
                    Frequency
                  </FieldLabel>

                  <Input
                    id={`${fieldPrefix}-cadence-frequency`}
                    min={1}
                    onChange={(event) => {
                      const next = event.currentTarget.valueAsNumber;
                      field.onChange(Number.isFinite(next) ? next : 1);
                    }}
                    step={1}
                    type="number"
                    value={field.value}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              control={form.control}
              name="cadence.period"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${fieldPrefix}-cadence-period`}>
                    Period
                  </FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id={`${fieldPrefix}-cadence-period`}>
                      <SelectValue placeholder="Select cadence period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            control={form.control}
            name="cadence.allowedDays"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Allowed cadence days</FieldLabel>
                <div className="flex flex-wrap gap-3 pt-1">
                  {days.map((day) => {
                    const id = `${fieldPrefix}-cadence-day-${day.value}`;
                    const checked = field.value.includes(day.value);
                    return (
                      <div className="flex items-center gap-2" key={day.value}>
                        <Checkbox
                          checked={checked}
                          id={id}
                          onCheckedChange={(next) => {
                            const isChecked = next === true;
                            const nextValue = isChecked
                              ? Array.from(new Set([...field.value, day.value]))
                              : field.value.filter(
                                  (value) => value !== day.value,
                                );
                            field.onChange(nextValue);
                          }}
                        />
                        <Label className="cursor-pointer" htmlFor={id}>
                          {day.label}
                        </Label>
                      </div>
                    );
                  })}
                </div>
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </FieldSet>

        <Controller
          control={form.control}
          name="targetCompletionDate"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${fieldPrefix}-target-completion`}>
                Target completion date
              </FieldLabel>
              <Input
                {...field}
                id={`${fieldPrefix}-target-completion`}
                readOnly
                type="datetime-local"
                value={field.value ?? ""}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        {formError && <FieldError>{formError}</FieldError>}
      </form>

      <DialogDrawerFooter className="gap-2">
        <Button
          onClick={() => onOpenChange(false)}
          type="button"
          variant="ghost"
        >
          Cancel
        </Button>
        <Button form="phase-manage-form" isLoading={isPending} type="submit">
          {submitLabel}
        </Button>
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}
