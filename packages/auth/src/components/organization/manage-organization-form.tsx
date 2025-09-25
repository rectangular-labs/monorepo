"use client";

import { AutoHeight } from "@rectangular-labs/ui/animation/auto-height";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { cn } from "@rectangular-labs/ui/utils/cn";
import { toSlug } from "@rectangular-labs/ui/utils/format/to-slug";
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
  }, [organization, form.reset]);

  return (
    <AutoHeight contentId={`organization-form-${organization?.id}`}>
      <Form {...form}>
        <form
          className={cn("grid gap-6", className)}
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="logo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://..." type="url" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input placeholder="Acme Inc" type="text" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {form.formState.errors.root && (
            <FormMessage>{form.formState.errors.root.message}</FormMessage>
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
      </Form>
    </AutoHeight>
  );
}
