"use client";

import type { RouterInputs } from "@rectangular-labs/api-seo/types";
import { strategySuggestionSchema } from "@rectangular-labs/core/schemas/strategy-parsers";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { getApiClientRq } from "~/lib/api";

type EditableStrategy = {
  id: string;
  name: string;
  description: string | null;
  motivation: string;
  goal: StrategyFormValues["goal"];
};

const formSchema = strategySuggestionSchema;
type StrategyFormValues = typeof formSchema.infer;

const goalMetricOptions = [
  { value: "conversions", label: "Conversions" },
  { value: "clicks", label: "Clicks" },
  { value: "impressions", label: "Impressions" },
  { value: "avgPosition", label: "Average position" },
] as const;

const goalTimeframeOptions = [
  { value: "monthly", label: "Monthly" },
  { value: "total", label: "Total" },
] as const;

export function ManageStrategyDialog({
  strategy,
  organizationId,
  projectId,
  open,
  onOpenChange,
}: {
  strategy?: EditableStrategy | null;
  organizationId: string;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();

  const navigate = useNavigate();

  const matcher = useMatchRoute();
  const slugParams = matcher({
    to: "/$organizationSlug/$projectSlug",
    fuzzy: true,
  });

  const defaultValues = useMemo<StrategyFormValues>(
    () => ({
      name: strategy?.name ?? "",
      description: strategy?.description ?? "",
      motivation: strategy?.motivation ?? "",
      goal: {
        metric: strategy?.goal?.metric ?? "clicks",
        target: strategy?.goal?.target ?? 0,
        timeframe: strategy?.goal?.timeframe ?? "monthly",
      },
    }),
    [strategy],
  );

  const form = useForm<StrategyFormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const { mutate: updateStrategy, isPending: isUpdating } = useMutation(
    api.strategy.update.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
      onSuccess: async () => {
        toast.success("Strategy updated");
        onOpenChange(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: api.strategy.list.queryKey({
              input: { organizationIdentifier: organizationId, projectId },
            }),
          }),
          strategy?.id
            ? queryClient.invalidateQueries({
                queryKey: api.strategy.get.queryKey({
                  input: {
                    organizationIdentifier: organizationId,
                    projectId,
                    id: strategy.id,
                  },
                }),
              })
            : Promise.resolve(),
        ]);
      },
    }),
  );

  const { mutate: createStrategy, isPending: isCreating } = useMutation(
    api.strategy.create.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
      onSuccess: async (data) => {
        toast.success("Strategy created");
        onOpenChange(false);
        await queryClient.invalidateQueries({
          queryKey: api.strategy.list.queryKey({
            input: { organizationIdentifier: organizationId, projectId },
          }),
        });

        if (slugParams && data.id) {
          await navigate({
            to: "/$organizationSlug/$projectSlug/strategies/$strategyId",
            params: {
              organizationSlug: slugParams.organizationSlug,
              projectSlug: slugParams.projectSlug,
              strategyId: data.id,
            },
          });
        }
      },
    }),
  );

  const submitForm = (values: StrategyFormValues) => {
    const payload: RouterInputs["strategy"]["create"] = {
      projectId,
      organizationIdentifier: organizationId,
      name: values.name.trim(),
      motivation: values.motivation.trim(),
      description: values.description?.trim() || null,
      goal: values.goal,
    };

    if (strategy) {
      updateStrategy({
        ...payload,
        id: strategy.id,
      });
      return;
    }

    createStrategy(payload);
  };

  const fieldPrefix = strategy
    ? `strategy-manage-${strategy.id}`
    : "strategy-manage-new";
  const formError = form.formState.errors.root?.message;
  const isPending = isUpdating || isCreating;
  const title = strategy ? "Edit strategy" : "New strategy";
  const submitLabel = strategy ? "Save changes" : "Create strategy";

  return (
    <DialogDrawer isLoading={isPending} onOpenChange={onOpenChange} open={open}>
      <DialogDrawerHeader>
        <DialogDrawerTitle>{title}</DialogDrawerTitle>
      </DialogDrawerHeader>

      <form
        className="grid max-h-[70vh] gap-6 overflow-y-auto"
        id="strategy-manage-form"
        onSubmit={form.handleSubmit(submitForm)}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-name`}>Name</FieldLabel>
                <Input
                  {...field}
                  id={`${fieldPrefix}-name`}
                  placeholder="Strategy name"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-description`}>
                  Description
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${fieldPrefix}-description`}
                  placeholder="What will you do and how will it work?"
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
            name="motivation"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-motivation`}>
                  Motivation
                </FieldLabel>
                <Textarea
                  {...field}
                  id={`${fieldPrefix}-motivation`}
                  placeholder="Why does this strategy matter?"
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
            name="goal.metric"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-goal-metric`}>
                  Goal metric
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={`${fieldPrefix}-goal-metric`}>
                    <SelectValue placeholder="Select a metric" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalMetricOptions.map((option) => (
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
            name="goal.target"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-goal-target`}>
                  Goal target
                </FieldLabel>
                <Input
                  {...field}
                  id={`${fieldPrefix}-goal-target`}
                  inputMode="numeric"
                  onChange={(event) => {
                    const nextValue = event.currentTarget.valueAsNumber;
                    field.onChange(nextValue);
                  }}
                  placeholder="Target number"
                  type="number"
                  value={Number.isFinite(field.value) ? field.value : ""}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="goal.timeframe"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${fieldPrefix}-goal-timeframe`}>
                  Timeframe
                </FieldLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id={`${fieldPrefix}-goal-timeframe`}>
                    <SelectValue placeholder="Select a timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    {goalTimeframeOptions.map((option) => (
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
        </FieldGroup>

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
        <Button
          disabled={!organizationId || !projectId}
          form="strategy-manage-form"
          isLoading={isUpdating || isCreating}
          type="submit"
        >
          {submitLabel}
        </Button>
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}
