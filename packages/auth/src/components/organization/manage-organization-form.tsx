"use client";

import { toSlug } from "@rectangular-labs/core/format/to-slug";
import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
import { cn } from "@rectangular-labs/ui/utils/cn";
import { type } from "arktype";
import type { Organization } from "better-auth/plugins";
import { useEffect } from "react";

export type OrganizationSettingCardProps = {
  organization?: Partial<Organization> | null;
  isSaving?: boolean;
  onSaved?: (
    orgValues: Partial<Organization>,
    isEdit: boolean,
  ) => void | Promise<void>;
  cancelButton?: React.ReactNode;
  className?: string;
};

const schema = type({
  name: "string > 0",
  logo: "string",
});

export function ManageOrganizationForm({
  organization,
  isSaving,
  onSaved,
  cancelButton,
  className,
}: OrganizationSettingCardProps) {
  const isEdit = !!organization?.id;
  const submitText = isEdit ? "Save changes" : "Create";

  const form = useForm({
    resolver: arktypeResolver(schema),
    defaultValues: {
      name: organization?.name ?? "",
      logo: organization?.logo ?? "",
    },
  });
  async function onSubmit(values: typeof schema.infer) {
    const slug = toSlug(values.name);
    try {
      await Promise.resolve(
        onSaved?.({ ...(organization ?? {}), ...values, slug }, isEdit),
      );
    } catch (error) {
      form.setError("root", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to save organization",
      });
    }
  }

  useEffect(() => {
    if (!organization) return;
    form.reset({
      name: organization.name ?? "",
      logo: organization.logo ?? "",
    });
  }, [organization, form]);

  return (
    <AutoHeight contentId={`organization-form-${organization?.id}`}>
      <form
        className={cn("grid gap-6", className)}
        onSubmit={form.handleSubmit(onSubmit)}
      >
        <FieldGroup>
          <Controller
            control={form.control}
            name="logo"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={`manage-organization-${organization?.id ?? "new"}-logo`}
                >
                  Logo URL
                </FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={`manage-organization-${organization?.id ?? "new"}-logo`}
                  placeholder="https://..."
                  type="url"
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            control={form.control}
            name="name"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={`manage-organization-${organization?.id ?? "new"}-name`}
                >
                  Name
                </FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  id={`manage-organization-${organization?.id ?? "new"}-name`}
                  placeholder="Acme Inc"
                  type="text"
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
        <div className="flex w-full justify-between">
          {cancelButton}
          <Button
            className="ml-auto"
            isLoading={form.formState.isSubmitting || isSaving}
            type="submit"
          >
            {submitText}
          </Button>
        </div>
      </form>
    </AutoHeight>
  );
}
