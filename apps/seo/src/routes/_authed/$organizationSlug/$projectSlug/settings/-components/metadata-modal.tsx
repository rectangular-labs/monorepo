"use client";

import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DialogDrawer,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import type {
  UseFieldArrayRemove,
  UseFieldArrayUpdate,
  UseFormReturn,
} from "@rectangular-labs/ui/components/ui/field";
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
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { type } from "arktype";
import type { WritingSettingFormSchema } from "../-lib/writing-settings";

const metadataSchema = type({
  name: "string",
  description: "string",
});
type MetadataFormData = typeof metadataSchema.infer;

function MetadataEdit({
  index,
  isUpdate,
  value,
  update,
  onClose,
  remove,
}: {
  index: number;
  onClose: () => void;
  isUpdate: boolean;
  value: MetadataFormData;
  update: UseFieldArrayUpdate<WritingSettingFormSchema, "metadata">;
  remove: UseFieldArrayRemove;
}) {
  const metadataForm = useForm<MetadataFormData>({
    resolver: arktypeResolver(metadataSchema),
    defaultValues: {
      ...value,
    },
  });

  function handleSubmit(data: MetadataFormData) {
    update(index, data);
    onClose();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={metadataForm.handleSubmit(handleSubmit)}
    >
      <FieldGroup>
        <Controller
          control={metadataForm.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`metadata-modal-${index}-name`}>
                Name
              </FieldLabel>
              <Input
                placeholder="Preset name"
                {...field}
                aria-invalid={fieldState.invalid}
                id={`metadata-modal-${index}-name`}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={metadataForm.control}
          name="description"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`metadata-modal-${index}-description`}>
                Description
              </FieldLabel>
              <Textarea
                placeholder="Short description, facts, or guidance for when to use this preset."
                rows={4}
                {...field}
                aria-invalid={fieldState.invalid}
                id={`metadata-modal-${index}-description`}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      {metadataForm.formState.errors.root && (
        <FieldError errors={[metadataForm.formState.errors.root]} />
      )}

      <DialogDrawerFooter className="justify-between sm:justify-between">
        {isUpdate && (
          <Button
            onClick={() => remove(index)}
            size="sm"
            type="button"
            variant="destructive"
          >
            <Icons.Trash className="h-4 w-4" />
            Delete
          </Button>
        )}
        <Button className="ml-auto" size="sm" type="submit">
          Save
        </Button>
      </DialogDrawerFooter>
    </form>
  );
}

export function MetadataModal({
  form,
  open,
  setOpen,
  metadataIndex,
  updateMetadata,
  removeMetadata,
}: {
  form: UseFormReturn<WritingSettingFormSchema>;
  open: boolean;
  setOpen: (open: boolean) => void;
  metadataIndex: number | null;
  updateMetadata: UseFieldArrayUpdate<WritingSettingFormSchema, "metadata">;
  removeMetadata: UseFieldArrayRemove;
}) {
  if (metadataIndex === null) {
    return null;
  }
  const currentMetadata = form.getValues(`metadata.${metadataIndex}`);
  if (!currentMetadata) {
    return null;
  }
  const isCreate = !currentMetadata.name && !currentMetadata.description;
  const onChangeHandler = (open: boolean) => {
    if (!open && isCreate) {
      removeMetadata(metadataIndex);
    }

    setOpen(open);
  };

  return (
    <DialogDrawer onOpenChange={onChangeHandler} open={open}>
      <DialogDrawerHeader>
        <DialogDrawerTitle className="flex items-center gap-2">
          <Icons.FileText className="h-4 w-4" />
          <span>{isCreate ? "Add metadata" : "Edit metadata"}</span>
        </DialogDrawerTitle>
      </DialogDrawerHeader>

      <MetadataEdit
        index={metadataIndex}
        isUpdate={!isCreate}
        onClose={() => setOpen(false)}
        remove={removeMetadata}
        update={updateMetadata}
        value={currentMetadata}
      />
    </DialogDrawer>
  );
}
