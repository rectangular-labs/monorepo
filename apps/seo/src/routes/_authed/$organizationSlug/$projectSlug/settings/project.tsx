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
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { type } from "arktype";
import { useCallback, useEffect } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { FloatingToolbar } from "./-components/floating-toolbar";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/project",
)({
  component: ProjectSettingsPage,
});

const formSchema = type({
  name: type("string")
    .atLeastLength(1)
    .configure({ message: () => "Name is required" }),
});
type ProjectSettingsFormValues = typeof formSchema.infer;

function ProjectSettingsPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: project,
    isLoading,
    error,
    refetch,
  } = useQuery(
    getApiClientRq().project.get.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );

  const form = useForm<ProjectSettingsFormValues>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const resetForm = useCallback(() => {
    if (!project) return;
    form.reset({
      name: project.name ?? "",
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
        toast.success("Project updated");
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.get.queryKey({
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

  function handleSave(values: ProjectSettingsFormValues) {
    if (!project) return;
    updateProject({
      id: project.id,
      organizationIdentifier: organizationSlug,
      name: values.name,
    });
  }

  if (!project || isLoading || error) {
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
    <form
      className="relative w-full space-y-6"
      onSubmit={form.handleSubmit(handleSave)}
    >
      <div className="space-y-2">
        <h1 className="font-semibold text-3xl tracking-tight">Project</h1>
        <p className="text-muted-foreground">
          Basic settings for your project.
        </p>
      </div>

      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="project-settings-name">Name</FieldLabel>
              <Input
                {...field}
                aria-invalid={fieldState.invalid}
                autoComplete="organization"
                id="project-settings-name"
                placeholder="My Project"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Field>
          <FieldLabel htmlFor="project-settings-websiteUrl">
            Website URL
          </FieldLabel>
          <Input
            disabled
            id="project-settings-websiteUrl"
            readOnly
            value={project.websiteUrl ?? ""}
          />
        </Field>
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
