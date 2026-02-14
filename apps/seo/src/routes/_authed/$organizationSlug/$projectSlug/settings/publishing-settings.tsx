import type { weekdaySchema } from "@rectangular-labs/core/schemas/strategy-parsers";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
  FieldGroup,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Label } from "@rectangular-labs/ui/components/ui/label";
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

const formSchema = type({
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
      participateInLinkExchange: true,
    };

    form.reset({
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

    const publishingSettings = {
      version: "v1" as const,
      requireContentReview: values.requireContentReview,
      requireSuggestionReview: values.requireSuggestionReview,
      participateInLinkExchange:
        project.publishingSettings?.participateInLinkExchange ?? true,
    };

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
