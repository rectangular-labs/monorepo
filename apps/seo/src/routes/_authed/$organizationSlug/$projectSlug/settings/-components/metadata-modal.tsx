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
} from "@rectangular-labs/ui/components/ui/form";
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
    <Form {...metadataForm}>
      <form
        className="space-y-4"
        onSubmit={metadataForm.handleSubmit(handleSubmit)}
      >
        <FormField
          control={metadataForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Preset name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={metadataForm.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Short description, facts, or guidance for when to use this preset."
                  rows={4}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        {metadataForm.formState.errors.root && (
          <FormMessage className="text-destructive">
            {metadataForm.formState.errors.root.message}
          </FormMessage>
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
    </Form>
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
