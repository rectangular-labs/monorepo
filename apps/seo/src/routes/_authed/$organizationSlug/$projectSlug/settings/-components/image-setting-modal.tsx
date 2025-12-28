"use client";

import {
  getImageFileNameFromUri,
  getMimeTypeFromFileName,
} from "@rectangular-labs/api-seo/client";
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
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import {
  FileUpload,
  type IFileUpload,
} from "@rectangular-labs/ui/components/ui/file-upload";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { type } from "arktype";
import { useEffect } from "react";
import { getApiClientRq } from "~/lib/api";
import { convertBlobUrlToDataUrl } from "~/lib/url";

export type ProjectImageKind = Exclude<
  RouterInputs["project"]["uploadProjectImage"]["kind"],
  "author-avatar"
>;

export type ImageItem = NonNullable<
  RouterOutputs["project"]["getImageSettings"]["imageSettings"]
>["brandLogos"][number];

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;
const MAX_SIZE = 3_000_000; // 3MB

function validateFile(
  file: IFileUpload | null | undefined,
): string | undefined {
  if (!file) {
    return "File is required";
  }

  if (
    !ALLOWED_TYPES.includes(file.mimeType as (typeof ALLOWED_TYPES)[number])
  ) {
    return `File must be one of: JPEG, PNG, GIF, or WEBP. Got: ${file.mimeType}`;
  }

  if (file.size > MAX_SIZE) {
    return `File "${file.name}" size must be less than ${MAX_SIZE / 1_000_000}MB. Current size: ${(file.size / 1_000_000).toFixed(2)}MB`;
  }

  return undefined;
}
const formSchema = type({
  files: type({
    mimeType: "string",
    size: "number",
    name: "string",
    url: "string.url",
  })
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
  onRemove,
}: {
  projectId: string;
  organizationId: string;
  kind: ProjectImageKind;
  initial?: ImageItem;
  onSubmit: (item: ImageItem) => void | Promise<void>;
  open: boolean;
  setOpen: (open: boolean) => void;
  onRemove: (item: ImageItem) => void;
}) {
  const { mutateAsync: uploadImages, isPending } = useMutation(
    getApiClientRq().project.uploadProjectImage.mutationOptions(),
  );
  const showNameField = kind === "brand-logo";
  const form = useForm<typeof formSchema.infer>({
    resolver: arktypeResolver(formSchema),
    defaultValues: {
      files: [],
      name: "",
      instructions: "",
    },
  });

  // Reset form when modal opens/closes or initial changes
  useEffect(() => {
    if (open) {
      form.reset({
        files:
          initial?.uris
            .map((uri) => {
              const fileName = getImageFileNameFromUri(uri);
              if (!fileName) {
                return null;
              }
              return {
                mimeType: getMimeTypeFromFileName(fileName),
                name: fileName,
                url: uri,
              };
            })
            .filter((file) => file !== null) ?? [],
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

    const filesToUpload: IFileUpload[] = [];
    const uris: string[] = [];

    for (const file of values.files) {
      const uploadedUri = (initial?.uris ?? []).find((uri) => uri === file.url);
      if (uploadedUri) {
        // The uploaded uri is a presigned url, which includes the bucket name and original uri, so we split the pathname and get the original uri
        const originalUri = new URL(uploadedUri).pathname
          .split("/")
          .slice(2)
          .join("/");
        uris.push(originalUri);
      } else {
        filesToUpload.push(
          file.url.startsWith("blob:")
            ? {
                mimeType: getMimeTypeFromFileName(file.name),
                size: file.size,
                name: file.name,
                url: await convertBlobUrlToDataUrl(file.url),
              }
            : file,
        );
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
      // project images for style and brand references are private, so we only add the private uris
      if (result.privateUris.length > 0) {
        uris.push(...result.privateUris);
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

  function handleRemove() {
    if (initial) {
      onRemove(initial);
    }
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

      <form className="space-y-4" onSubmit={form.handleSubmit(handleSubmit)}>
        <FieldGroup>
          <Controller
            control={form.control}
            name="files"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`image-setting-modal-${kind}-files`}>
                  File
                </FieldLabel>
                <FileUpload
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  disabled={field.disabled}
                  files={field.value}
                  id={`image-setting-modal-${kind}-files`}
                  maxSizeMB={MAX_SIZE / 1_000_000}
                  multiple
                  name={field.name}
                  onChange={(event) => {
                    field.onChange([
                      ...field.value,
                      ...Array.from(event.target.files ?? []).map((file) => ({
                        mimeType: file.type,
                        size: file.size,
                        name: file.name,
                        url: URL.createObjectURL(file),
                      })),
                    ]);
                  }}
                  onDropFiles={(event) => {
                    field.onChange([
                      ...field.value,
                      ...Array.from(event.dataTransfer.files ?? []).map(
                        (file) => ({
                          mimeType: file.type,
                          size: file.size,
                          name: file.name,
                          url: URL.createObjectURL(file),
                        }),
                      ),
                    ]);
                  }}
                  ref={field.ref}
                  setFiles={(items) => {
                    field.onChange(items);
                  }}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          {showNameField && (
            <Controller
              control={form.control}
              name="name"
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`image-setting-modal-${kind}-name`}>
                    Name
                  </FieldLabel>
                  <Input
                    placeholder="Logo name (optional)"
                    {...field}
                    aria-invalid={fieldState.invalid}
                    id={`image-setting-modal-${kind}-name`}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          )}

          <Controller
            control={form.control}
            name="instructions"
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel
                  htmlFor={`image-setting-modal-${kind}-instructions`}
                >
                  Instructions
                </FieldLabel>
                <Textarea
                  id={`image-setting-modal-${kind}-instructions`}
                  placeholder="How should this image be used? Composition, style, brand rules, etc."
                  rows={4}
                  {...field}
                  aria-invalid={fieldState.invalid}
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

        <div className="flex justify-between gap-2">
          {initial && (
            <Button onClick={handleRemove} size="sm" variant="destructive">
              Remove
            </Button>
          )}
          <Button
            className="ml-auto"
            isLoading={isPending}
            size="sm"
            type="submit"
          >
            Save
          </Button>
        </div>
      </form>
    </DialogDrawer>
  );
}
