"use client";

import { getImageFileNameFromUri } from "@rectangular-labs/api-seo/client";
import type {
  RouterInputs,
  RouterOutputs,
} from "@rectangular-labs/api-seo/types";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  DialogDrawer,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import { FileUpload } from "@rectangular-labs/ui/components/ui/file-upload";
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
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect } from "react";
import { getApiClientRq } from "~/lib/api";

export type ProjectImageKind = Exclude<
  RouterInputs["project"]["uploadProjectImage"]["kind"],
  "author-avatar"
>;

export type ImageItem = NonNullable<
  RouterOutputs["project"]["getImageSettings"]["imageSettings"]
>["brandLogos"][number];
export type UploadImageItem = Omit<ImageItem, "images">;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
const MAX_SIZE = 5_000_000; // 5MB

function validateFile(file: File | null | undefined): string | undefined {
  if (!file) {
    return "File is required";
  }

  if (!ALLOWED_TYPES.includes(file.type as (typeof ALLOWED_TYPES)[number])) {
    return `File must be one of: JPEG, PNG, GIF, or WEBP. Got: ${file.type}`;
  }

  if (file.size > MAX_SIZE) {
    return `File "${file.name}" size must be less than ${MAX_SIZE / 1_000_000}MB. Current size: ${(file.size / 1_000_000).toFixed(2)}MB`;
  }

  return undefined;
}
const formSchema = type({
  files: type
    .instanceOf(File)
    .array()
    .narrow((files, ctx) => {
      for (const file of files) {
        const validationError = validateFile(file);
        if (validationError) {
          return ctx.reject({
            message: validationError,
          });
        }
      }
      return true;
    }),
  name: "string",
  instructions: "string",
});

export function ImageSettingModal({
  kind,
  projectId,
  organizationId,
  initial,
  onSubmit,
  open,
  setOpen,
}: {
  projectId: string;
  organizationId: string;
  kind: ProjectImageKind;
  initial?: ImageItem;
  onSubmit: (item: UploadImageItem) => void | Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
}) {
  const { mutateAsync: uploadImages, isPending } = useMutation(
    getApiClientRq().project.uploadProjectImage.mutationOptions(),
  );
  const showNameField = kind === "brand-logo";
  const form = useForm<typeof formSchema.infer>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      files: [],
      name: initial?.name ?? "",
      instructions: initial?.instructions ?? "",
    },
  });

  // Reset form when modal opens/closes or initial changes
  useEffect(() => {
    if (open) {
      form.reset({
        files: initial?.images ?? [],
        name: initial?.name ?? "",
        instructions: initial?.instructions ?? "",
      });
    }
  }, [open, initial, form]);

  async function handleSubmit(values: typeof formSchema.infer) {
    if (values.files.length === 0) {
      form.setError("root", { message: "At least one file is required" });
      return;
    }

    const uploadedItems = (initial?.uris ?? []).map((uri) => {
      return { fileName: getImageFileNameFromUri(uri), uri };
    });
    const filesToUpload: File[] = [];
    const uris: string[] = [];

    for (const file of values.files) {
      const fileName = file.name;
      const uploadedItem = uploadedItems.find(
        (item) => item.fileName === fileName,
      );
      if (uploadedItem) {
        uris.push(uploadedItem.uri);
      } else {
        filesToUpload.push(file);
      }
    }

    if (filesToUpload.length > 0) {
      const result = await uploadImages({
        id: projectId,
        organizationIdentifier: organizationId,
        kind,
        files: filesToUpload,
      }).catch((e) => {
        form.setError("root", { message: e.message });
        return null;
      });
      if (!result) return;
      if (result.uris) {
        uris.push(...result.uris);
      }
    }

    await Promise.resolve(
      onSubmit({
        uris,
        name: values.name?.trim() || undefined,
        instructions: values.instructions?.trim() || undefined,
      }),
    );
    form.reset();
    setOpen(false);
  }

  return (
    <DialogDrawer onOpenChange={setOpen} open={open}>
      <DialogDrawerHeader>
        <DialogDrawerTitle className="flex items-center gap-2">
          <Icons.Image className="h-4 w-4" />
          <span>{initial ? "Edit image" : "Add image"}</span>
        </DialogDrawerTitle>
      </DialogDrawerHeader>

      <Form {...form}>
        <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
          <div className="space-y-3 text-sm">
            <FormField
              control={form.control}
              name="files"
              render={({ field }) => {
                return (
                  <FormItem>
                    <FormLabel>File</FormLabel>
                    <FormControl>
                      <FileUpload
                        accept="image/jpeg,image/png,image/gif,image/webp"
                        disabled={field.disabled}
                        files={field.value}
                        maxSizeMB={MAX_SIZE / 1_000_000}
                        multiple
                        name={field.name}
                        onChange={(event) => {
                          field.onChange([
                            ...field.value,
                            ...Array.from(event.target.files ?? []),
                          ]);
                        }}
                        onDropFiles={(event) => {
                          field.onChange([
                            ...field.value,
                            ...Array.from(event.dataTransfer.files ?? []),
                          ]);
                        }}
                        ref={field.ref}
                        setFiles={(items) => {
                          field.onChange(items);
                        }}
                      />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                );
              }}
            />

            {showNameField && (
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Logo name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="How should this image be used? Composition, style, brand rules, etc."
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.formState.errors.root && (
            <FormMessage className="text-destructive">
              {form.formState.errors.root.message}
            </FormMessage>
          )}

          <div className="flex justify-end gap-2">
            <Button isLoading={isPending} size="sm" type="submit">
              Save
            </Button>
          </div>
        </form>
      </Form>
    </DialogDrawer>
  );
}
