"use client";

import type { RouterOutputs } from "@rectangular-labs/api-seo/types";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DialogDrawer,
  DialogDrawerDescription,
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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect, useMemo } from "react";
import { getApiClientRq } from "~/lib/api";

const formSchema = type({
  title: "string",
  description: "string",
  slug: type("string")
    .atLeastLength(1)
    .configure({ message: () => "Slug is required." }),
  primaryKeyword: type("string")
    .atLeastLength(1)
    .configure({ message: () => "Primary keyword is required." }),
  heroImage: "string",
  heroImageCaption: "string",
  contentMarkdown: "string",
  strategyId: "string",
});

export function ManageContentMetadataDialog({
  canEdit,
  draftDetails,
  draftId,
  onOpenChange,
  open,
  organizationIdentifier,
  projectId,
}: {
  canEdit: boolean;
  draftDetails:
    | RouterOutputs["content"]["getDraftDetails"]["contentDraft"]
    | null;
  draftId: string | null;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  organizationIdentifier: string;
  projectId: string;
}) {
  const api = getApiClientRq();
  const queryClient = useQueryClient();
  const isCreate = !draftId || !draftDetails;
  const strategyListQuery = useQuery(
    api.strategy.list.queryOptions({
      input: {
        organizationIdentifier,
        projectId,
      },
      enabled: open,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 30,
    }),
  );
  const strategies = strategyListQuery.data?.strategies ?? [];

  const defaultValues = useMemo<typeof formSchema.infer>(
    () => ({
      title: draftDetails?.title ?? "",
      description: draftDetails?.description ?? "",
      slug: draftDetails?.slug ?? "",
      primaryKeyword: draftDetails?.primaryKeyword ?? "",
      heroImage: draftDetails?.heroImage ?? "",
      heroImageCaption: draftDetails?.heroImageCaption ?? "",
      contentMarkdown: draftDetails?.contentMarkdown ?? "",
      strategyId: draftDetails?.strategyId ?? "",
    }),
    [draftDetails],
  );

  const form = useForm<typeof formSchema.infer>({
    resolver: arktypeResolver(formSchema),
    defaultValues: defaultValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
    }
  }, [defaultValues, form, open]);

  const { mutate: updateDraft, isPending } = useMutation(
    api.content.updateDraft.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
      onSuccess: async () => {
        toast.success("Metadata updated");
        onOpenChange(false);
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: api.content.list.queryKey({
              input: {
                organizationIdentifier,
                projectId,
              },
            }),
          }),
          draftId
            ? queryClient.invalidateQueries({
                queryKey: api.content.getDraftDetails.queryKey({
                  input: {
                    organizationIdentifier,
                    projectId,
                    id: draftId,
                    months: 3,
                  },
                }),
              })
            : Promise.resolve(),
        ]);
      },
    }),
  );

  const slug = form.watch("slug");
  const primaryKeyword = form.watch("primaryKeyword");
  const hasRequiredMetadata =
    slug.trim().length > 0 && primaryKeyword.trim().length > 0;

  const submitForm = (values: typeof formSchema.infer) => {
    if (!draftId || isCreate) {
      toast.error("Draft creation from this dialog is not available yet.");
      return;
    }

    updateDraft({
      organizationIdentifier,
      projectId,
      id: draftId,
      title: values.title.trim(),
      description: values.description.trim(),
      slug: values.slug.trim(),
      primaryKeyword: values.primaryKeyword.trim(),
      heroImage: values.heroImage.trim() || null,
      heroImageCaption: values.heroImageCaption.trim() || null,
      strategyId: values.strategyId || null,
    });
  };

  const title = isCreate ? "Create content draft" : "Edit draft metadata";
  const description = isCreate
    ? "Set content metadata and create a new draft."
    : "Update title, URL, keyword, and strategy assignment.";
  const submitLabel = isCreate ? "Create content" : "Save metadata";

  return (
    <DialogDrawer isLoading={isPending} onOpenChange={onOpenChange} open={open}>
      <DialogDrawerHeader>
        <DialogDrawerTitle>{title}</DialogDrawerTitle>
        <DialogDrawerDescription>{description}</DialogDrawerDescription>
      </DialogDrawerHeader>

      <form
        className="grid max-h-[70vh] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2"
        id="content-metadata-form"
        onSubmit={form.handleSubmit(submitForm)}
      >
        <FieldGroup className="grid grid-cols-1 gap-4 sm:col-span-2 sm:grid-cols-2">
          <Controller
            control={form.control}
            name="strategyId"
            render={({ field }) => (
              <Field className="space-y-2 sm:col-span-2">
                <FieldLabel>Assigned strategy</FieldLabel>
                <Select
                  disabled={!canEdit || strategyListQuery.isLoading}
                  onValueChange={(value) =>
                    field.onChange(value === "none" ? "" : value)
                  }
                  value={field.value || "none"}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Assign to a strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No strategy</SelectItem>
                    {strategies.map((strategy) => (
                      <SelectItem key={strategy.id} value={strategy.id}>
                        <span className="block w-full truncate">
                          {strategy.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="title"
            render={({ field }) => (
              <Field className="sm:col-span-2">
                <FieldLabel>Title</FieldLabel>
                <FieldDescription>
                  Optional. Leave blank and we will generate an optimized title
                  from SERPs and the primary keyword.
                </FieldDescription>
                <Input {...field} disabled={!canEdit} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="slug"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Slug</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={!canEdit}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="primaryKeyword"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel>Primary keyword</FieldLabel>
                <Input
                  {...field}
                  aria-invalid={fieldState.invalid}
                  disabled={!canEdit}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="heroImage"
            render={({ field }) => (
              <Field>
                <FieldLabel>Hero image URL</FieldLabel>
                <Input {...field} disabled={!canEdit} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="heroImageCaption"
            render={({ field }) => (
              <Field>
                <FieldLabel>Hero caption</FieldLabel>
                <Input {...field} disabled={!canEdit} />
              </Field>
            )}
          />

          <Controller
            control={form.control}
            name="description"
            render={({ field }) => (
              <Field className="sm:col-span-2">
                <FieldLabel>Meta description</FieldLabel>
                <FieldDescription>
                  Optional. Leave blank and we will generate an optimized
                  description from SERPs and the primary keyword.
                </FieldDescription>
                <Textarea {...field} disabled={!canEdit} rows={4} />
              </Field>
            )}
          />
        </FieldGroup>
      </form>

      <DialogDrawerFooter className="gap-2">
        <Button
          disabled={!canEdit || isPending || !hasRequiredMetadata}
          form="content-metadata-form"
          type="submit"
        >
          {submitLabel}
        </Button>
        <Button
          onClick={() => onOpenChange(false)}
          type="button"
          variant="outline"
        >
          Cancel
        </Button>
      </DialogDrawerFooter>
    </DialogDrawer>
  );
}
