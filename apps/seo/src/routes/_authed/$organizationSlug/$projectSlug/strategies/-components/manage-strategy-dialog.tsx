"use client";

import type { RouterInputs } from "@rectangular-labs/api-seo/types";
import {
  type strategyEditableSchema,
  strategyManageFormSchema,
} from "@rectangular-labs/core/schemas/strategy-parsers";
import { getStrategyKeywordStats } from "@rectangular-labs/core/strategy/get-strategy-keyword-stats";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DialogDrawer,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import {
  arktypeResolver,
  type Control,
  Controller,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMatchRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo } from "react";
import { getApiClientRq } from "~/lib/api";

type EditableStrategy = {
  id: string;
  name: string;
  motivation: string;
  goal: StrategyFormValues["goal"];
  keywordUniverse?:
    | RouterInputs["strategy"]["create"]["keywordUniverse"]
    | null;
  llmQueries?: RouterInputs["strategy"]["create"]["llmQueries"] | null;
};

type StrategyFormValues = typeof strategyEditableSchema.infer;
type ManageStrategyFormValues = typeof strategyManageFormSchema.infer;
type KeywordClusterFormValue =
  ManageStrategyFormValues["keywordClusters"][number];
type LlmQueryFormValue = ManageStrategyFormValues["llmQueries"][number];

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

function KeywordClusterFields({
  control,
  fieldPrefix,
  index,
  onRemove,
}: {
  control: Control<ManageStrategyFormValues>;
  fieldPrefix: string;
  index: number;
  onRemove: () => void;
}) {
  const {
    fields: supportingKeywordFields,
    append: appendSupportingKeyword,
    remove: removeSupportingKeyword,
  } = useFieldArray({
    control,
    name: `keywordClusters.${index}.supportingKeywords`,
  });

  return (
    <FieldGroup>
      <div className="flex items-center justify-between gap-2">
        <FieldLabel>Keyword cluster {index + 1}</FieldLabel>
        <Button onClick={onRemove} size="icon" type="button" variant="ghost">
          <Icons.Trash className="h-4 w-4" />
        </Button>
      </div>

      <Controller
        control={control}
        name={`keywordClusters.${index}.coreKeyword`}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${fieldPrefix}-cluster-${index}-core`}>
              Core keyword
            </FieldLabel>
            <Input
              {...field}
              id={`${fieldPrefix}-cluster-${index}-core`}
              placeholder="Primary keyword"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="space-y-3">
        <FieldLabel>Supporting keywords</FieldLabel>

        {supportingKeywordFields.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No supporting keywords yet.
          </p>
        )}

        {supportingKeywordFields.map((supportingKeywordField, keywordIndex) => (
          <div
            className="flex items-start gap-2"
            key={supportingKeywordField.id}
          >
            <Controller
              control={control}
              name={`keywordClusters.${index}.supportingKeywords.${keywordIndex}.value`}
              render={({ field, fieldState }) => (
                <Field className="flex-1" data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`${fieldPrefix}-cluster-${index}-supporting-${keywordIndex}`}
                  >
                    Keyword {keywordIndex + 1}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${fieldPrefix}-cluster-${index}-supporting-${keywordIndex}`}
                    placeholder="Supporting keyword"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Button
              className="mt-7"
              onClick={() => removeSupportingKeyword(keywordIndex)}
              size="icon"
              type="button"
              variant="ghost"
            >
              <Icons.Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button
          onClick={() => appendSupportingKeyword({ value: "" })}
          size="sm"
          type="button"
          variant="outline"
        >
          <Icons.Plus className="mr-2 h-4 w-4" />
          Add keyword
        </Button>
      </div>
    </FieldGroup>
  );
}

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

  const keywordStats = useMemo(
    () =>
      getStrategyKeywordStats({
        keywordUniverse: strategy?.keywordUniverse,
        llmQueries: strategy?.llmQueries,
      }),
    [strategy?.keywordUniverse, strategy?.llmQueries],
  );

  const defaultKeywordClusters = useMemo<KeywordClusterFormValue[]>(() => {
    return keywordStats.clusters.map((cluster) => {
      const keywords = cluster.keywords.filter(
        (keyword) => keyword.status === "active",
      );
      return {
        clusterId: cluster.clusterId,
        coreKeyword: cluster.coreKeyword?.keyword ?? "",
        supportingKeywords: keywords
          .filter((keyword) => keyword.category === "supporting")
          .map((keyword) => ({ value: keyword.keyword })),
      };
    });
  }, [keywordStats.clusters]);

  const defaultLlmQueries = useMemo<LlmQueryFormValue[]>(
    () => keywordStats.activeQueries.map((query) => ({ query: query.query })),
    [keywordStats.activeQueries],
  );

  const defaultValues = useMemo<ManageStrategyFormValues>(
    () => ({
      name: strategy?.name ?? "",
      motivation: strategy?.motivation ?? "",
      goal: {
        metric: strategy?.goal?.metric ?? "clicks",
        target: strategy?.goal?.target ?? 0,
        timeframe: strategy?.goal?.timeframe ?? "monthly",
      },
      keywordClusters: defaultKeywordClusters,
      llmQueries: defaultLlmQueries,
    }),
    [defaultKeywordClusters, defaultLlmQueries, strategy],
  );

  const form = useForm<ManageStrategyFormValues>({
    resolver: arktypeResolver(strategyManageFormSchema),
    defaultValues,
  });
  const {
    fields: keywordClusterFields,
    append: appendKeywordCluster,
    remove: removeKeywordCluster,
    replace: replaceKeywordClusters,
  } = useFieldArray({
    control: form.control,
    name: "keywordClusters",
  });
  const {
    fields: llmQueryFields,
    append: appendLlmQuery,
    remove: removeLlmQuery,
    replace: replaceLlmQueries,
  } = useFieldArray({
    control: form.control,
    name: "llmQueries",
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      replaceKeywordClusters(defaultKeywordClusters);
      replaceLlmQueries(defaultLlmQueries);
    }
  }, [
    defaultKeywordClusters,
    defaultLlmQueries,
    defaultValues,
    form,
    open,
    replaceKeywordClusters,
    replaceLlmQueries,
  ]);

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

  const submitForm = (values: ManageStrategyFormValues) => {
    const existingKeywordByValue = new Map(
      strategy?.keywordUniverse?.items.map((item) => [item.keyword, item]) ??
        [],
    );
    const existingQueryByValue = new Map(
      strategy?.llmQueries?.items.map((item) => [item.query, item]) ?? [],
    );
    const normalizedKeywordItems = values.keywordClusters.flatMap((cluster) => {
      const coreKeyword = cluster.coreKeyword.trim();
      const supportingKeywords = cluster.supportingKeywords
        .map((keyword) => keyword.value.trim())
        .filter(Boolean);
      const keywords = Array.from(
        new Set([coreKeyword, ...supportingKeywords]),
      ).filter(Boolean);

      return keywords.map((keyword, index) => {
        const existing = existingKeywordByValue.get(keyword);
        return {
          id: existing?.id ?? crypto.randomUUID(),
          keyword,
          clusterId: cluster.clusterId,
          status: "active" as const,
          source: existing?.source ?? { type: "strategyGeneration" as const },
          category: index === 0 ? ("core" as const) : ("supporting" as const),
          intent: existing?.intent ?? null,
          difficulty: existing?.difficulty ?? null,
          searchVolume: existing?.searchVolume ?? null,
          cpc: existing?.cpc ?? null,
          cpcCompetitionLevel: existing?.cpcCompetitionLevel ?? null,
        };
      });
    });
    const normalizedLlmQueries = values.llmQueries
      .map((item) => item.query.trim())
      .filter(Boolean)
      .map((query) => {
        const existing = existingQueryByValue.get(query);
        return {
          id: existing?.id ?? crypto.randomUUID(),
          query,
          rationale: existing?.rationale ?? null,
          status: "active" as const,
        };
      });

    const payload: RouterInputs["strategy"]["create"] = {
      projectId,
      organizationIdentifier: organizationId,
      name: values.name.trim(),
      motivation: values.motivation.trim(),
      goal: values.goal,
      keywordUniverse:
        normalizedKeywordItems.length > 0
          ? {
              version: 1,
              items: normalizedKeywordItems,
            }
          : null,
      llmQueries:
        normalizedLlmQueries.length > 0
          ? {
              version: 1,
              items: normalizedLlmQueries,
            }
          : null,
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
  const showKeywordFields = !!strategy;

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

          {showKeywordFields && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <FieldLabel>Keyword clusters</FieldLabel>
                  <Button
                    onClick={() =>
                      appendKeywordCluster({
                        clusterId: crypto.randomUUID(),
                        coreKeyword: "",
                        supportingKeywords: [],
                      })
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    <Icons.Plus className="mr-2 h-4 w-4" />
                    Add cluster
                  </Button>
                </div>

                {keywordClusterFields.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No keyword clusters yet.
                  </p>
                )}

                {keywordClusterFields.map((cluster, index) => (
                  <KeywordClusterFields
                    control={form.control}
                    fieldPrefix={fieldPrefix}
                    index={index}
                    key={cluster.id}
                    onRemove={() => removeKeywordCluster(index)}
                  />
                ))}
              </div>

              <div className="space-y-3">
                <FieldLabel>LLM queries</FieldLabel>

                {llmQueryFields.length === 0 && (
                  <p className="text-muted-foreground text-sm">
                    No queries yet.
                  </p>
                )}

                {llmQueryFields.map((queryField, index) => (
                  <div className="flex items-start gap-2" key={queryField.id}>
                    <Controller
                      control={form.control}
                      name={`llmQueries.${index}.query`}
                      render={({ field, fieldState }) => (
                        <Field
                          className="flex-1"
                          data-invalid={fieldState.invalid}
                        >
                          <FieldLabel
                            htmlFor={`${fieldPrefix}-llm-query-${index}`}
                          >
                            Query {index + 1}
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id={`${fieldPrefix}-llm-query-${index}`}
                            placeholder="LLM query"
                            rows={3}
                          />
                          {fieldState.invalid && (
                            <FieldError errors={[fieldState.error]} />
                          )}
                        </Field>
                      )}
                    />
                    <Button
                      className="mt-7"
                      onClick={() => removeLlmQuery(index)}
                      size="icon"
                      type="button"
                      variant="ghost"
                    >
                      <Icons.Trash className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <Button
                  onClick={() => appendLlmQuery({ query: "" })}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  <Icons.Plus className="mr-2 h-4 w-4" />
                  Add query
                </Button>
              </div>
            </>
          )}

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
                  rows={6}
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
