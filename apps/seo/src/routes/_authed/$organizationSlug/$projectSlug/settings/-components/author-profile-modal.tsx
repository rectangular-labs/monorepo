"use client";

import { getInitials } from "@rectangular-labs/core/format/initials";
import { authorSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@rectangular-labs/ui/components/ui/avatar";
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
  useFieldArray,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useRef } from "react";
import type { WritingSettingFormSchema } from "../-lib/writing-settings";

type AuthorFormData = typeof authorSettingsSchema.infer;
function AuthorEdit({
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
  value: AuthorFormData;
  update: UseFieldArrayUpdate<WritingSettingFormSchema, "authors">;
  remove: UseFieldArrayRemove;
}) {
  const authorForm = useForm<AuthorFormData>({
    resolver: arktypeResolver(authorSettingsSchema),
    defaultValues: {
      ...value,
      socialLinks: value.socialLinks ?? [],
    },
  });
  const avatarUri = authorForm.watch("avatarUri");
  console.log("avatarUri", avatarUri);
  if (avatarUri) {
    fetch(avatarUri)
      .then(async (res) => {
        const blob = await res.blob();
        console.log("avatarUri file info:", {
          blob,
        });
      })
      .catch((err) => {
        console.error("Error fetching avatarUri blob:", err);
      });
  }

  const fileInputRef = useRef<HTMLInputElement>(null);
  const {
    fields: socialLinkFields,
    append: appendSocialLink,
    remove: removeSocialLink,
  } = useFieldArray({
    control: authorForm.control,
    name: "socialLinks",
  });

  function handleSubmit(data: AuthorFormData) {
    update(index, data);
    onClose();
  }
  function handleRemove() {
    remove(index);
    onClose();
  }

  return (
    <form
      className="space-y-4"
      onSubmit={authorForm.handleSubmit(handleSubmit)}
    >
      <input
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (file.size > 500_000) {
              authorForm.setError("avatarUri", {
                message: "Avatar must be less than 500KB",
              });
              return;
            }
            authorForm.clearErrors("avatarUri");
            authorForm.setValue("avatarUri", URL.createObjectURL(file));
          }
        }}
        ref={fileInputRef}
        type="file"
      />
      <div className="flex w-full flex-col items-center justify-center gap-2">
        <Avatar
          className="size-18"
          onClick={() => fileInputRef.current?.click()}
        >
          <AvatarImage src={authorForm.watch("avatarUri")} />
          <AvatarFallback>
            {getInitials(authorForm.watch("name") ?? "")
              .slice(0, 2)
              .toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {authorForm.formState.errors.avatarUri && (
          <FieldError errors={[authorForm.formState.errors.avatarUri]} />
        )}
      </div>

      <FieldGroup>
        <Controller
          control={authorForm.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`author-modal-${index}-name`}>
                Name
              </FieldLabel>
              <Input
                placeholder="Full name"
                {...field}
                aria-invalid={fieldState.invalid}
                id={`author-modal-${index}-name`}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={authorForm.control}
          name="title"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`author-modal-${index}-title`}>
                Title
              </FieldLabel>
              <Input
                placeholder="Product Designer, Content Lead, etc."
                {...field}
                aria-invalid={fieldState.invalid}
                id={`author-modal-${index}-title`}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
        <Controller
          control={authorForm.control}
          name="bio"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`author-modal-${index}-bio`}>Bio</FieldLabel>
              <Textarea
                placeholder="2-3 sentences that describe the author's expertise and credibility."
                {...field}
                aria-invalid={fieldState.invalid}
                id={`author-modal-${index}-bio`}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex items-center justify-between">
        <FieldLabel>Social links</FieldLabel>
        <Button
          onClick={() => appendSocialLink({ platform: "", url: "" })}
          size="icon"
          type="button"
          variant="ghost"
        >
          <Icons.Plus className="size-4" />
        </Button>
      </div>
      {socialLinkFields.length === 0 && (
        <p className="text-center text-muted-foreground text-sm">
          No Social yet. Add one to help readers find you online.
        </p>
      )}
      {socialLinkFields.map((field, socialIndex) => (
        <div className="flex items-center gap-2" key={field.id}>
          <div className="flex items-start gap-2">
            <Controller
              control={authorForm.control}
              name={`socialLinks.${socialIndex}.platform`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`author-modal-${index}-social-${socialIndex}-platform`}
                  >
                    Platform
                  </FieldLabel>
                  <Input
                    id={`author-modal-${index}-social-${socialIndex}-platform`}
                    list={`author-modal-${index}-platforms-${socialIndex}`}
                    placeholder="X, LinkedIn, etc."
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  <datalist
                    id={`author-modal-${index}-platforms-${socialIndex}`}
                  >
                    <option value="X" />
                    <option value="TikTok" />
                    <option value="YouTube" />
                    <option value="LinkedIn" />
                    <option value="Facebook" />
                    <option value="Instagram" />
                  </datalist>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
            <Controller
              control={authorForm.control}
              name={`socialLinks.${socialIndex}.url`}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor={`author-modal-${index}-social-${socialIndex}-url`}
                  >
                    URL
                  </FieldLabel>
                  <Input
                    id={`author-modal-${index}-social-${socialIndex}-url`}
                    placeholder="https://www.linkedin.com/in/your-profile"
                    {...field}
                    aria-invalid={fieldState.invalid}
                  />
                  {authorForm.formState.errors.socialLinks?.root?.message?.includes(
                    `socialLinks[${socialIndex}].url`,
                  ) && (
                    <FieldError>platform link must be a valid URL</FieldError>
                  )}
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Button
            onClick={() => removeSocialLink(socialIndex)}
            size="icon-sm"
            type="button"
            variant="ghost"
          >
            <Icons.Trash />
          </Button>
        </div>
      ))}
      {authorForm.formState.errors.root && (
        <FieldError errors={[authorForm.formState.errors.root]} />
      )}

      <DialogDrawerFooter className="justify-between sm:justify-between">
        {isUpdate && (
          <Button
            onClick={handleRemove}
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

export function AuthorProfileModal({
  form,
  open,
  setOpen,
  authorIndex,
  updateAuthor,
  removeAuthor,
}: {
  form: UseFormReturn<WritingSettingFormSchema>;
  open: boolean;
  setOpen: (open: boolean) => void;
  authorIndex: number | null;
  updateAuthor: UseFieldArrayUpdate<WritingSettingFormSchema, "authors">;
  removeAuthor: UseFieldArrayRemove;
}) {
  if (authorIndex === null) {
    return null;
  }
  const currentAuthor = form.getValues(`authors.${authorIndex}`);
  if (!currentAuthor) {
    return null;
  }
  const isCreate =
    !currentAuthor.name &&
    !currentAuthor.title &&
    !currentAuthor.bio &&
    currentAuthor.socialLinks?.length === 0;
  const onChangeHandler = (open: boolean) => {
    if (!open && isCreate) {
      removeAuthor(authorIndex);
    }

    setOpen(open);
  };

  return (
    <DialogDrawer onOpenChange={onChangeHandler} open={open}>
      <DialogDrawerHeader>
        <DialogDrawerTitle className="flex items-center gap-2">
          <Icons.User className="h-4 w-4" />
          <span>{isCreate ? "Add author" : "Edit author"}</span>
        </DialogDrawerTitle>
      </DialogDrawerHeader>

      <AuthorEdit
        index={authorIndex}
        isUpdate={!isCreate}
        onClose={() => setOpen(false)}
        remove={removeAuthor}
        update={updateAuthor}
        value={currentAuthor}
      />
    </DialogDrawer>
  );
}
