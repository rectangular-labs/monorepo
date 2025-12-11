"use client";

import { authorSettingsSchema } from "@rectangular-labs/db/parsers";
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
} from "@rectangular-labs/ui/components/ui/form";
import {
  arktypeResolver,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  useFieldArray,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { getInitials } from "@rectangular-labs/ui/utils/format/initials";
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
    <Form {...authorForm}>
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
              authorForm.setValue("avatarUri", URL.createObjectURL(file));
            }
          }}
          ref={fileInputRef}
          type="file"
        />
        <div className="flex w-full items-center justify-center gap-2">
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
        </div>

        <FormField
          control={authorForm.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="Full name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={authorForm.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input
                  placeholder="Product Designer, Content Lead, etc."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={authorForm.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="2-3 sentences that describe the author's expertise and credibility."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex items-center justify-between">
          <FormLabel>Social links</FormLabel>
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
          <div className="flex gap-2" key={field.id}>
            <FormField
              control={authorForm.control}
              name={`socialLinks.${socialIndex}.platform`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      list="platforms"
                      placeholder="X, LinkedIn, etc."
                      {...field}
                    />
                  </FormControl>
                  <datalist id="platforms">
                    <option value="X" />
                    <option value="TikTok" />
                    <option value="YouTube" />
                    <option value="LinkedIn" />
                    <option value="Facebook" />
                    <option value="Instagram" />
                  </datalist>

                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={authorForm.control}
              name={`socialLinks.${socialIndex}.url`}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="https://www.linkedin.com/in/your-profile"
                      {...field}
                    />
                  </FormControl>
                  {authorForm.formState.errors.socialLinks?.root?.message?.includes(
                    `socialLinks[${socialIndex}].url`,
                  ) && (
                    <FormMessage className="text-destructive">
                      platform link must be a valid URL
                    </FormMessage>
                  )}
                </FormItem>
              )}
            />
            <Button
              onClick={() => removeSocialLink(socialIndex)}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <Icons.Trash className="h-4 w-4" />
            </Button>
          </div>
        ))}
        {authorForm.formState.errors.root && (
          <FormMessage className="text-destructive">
            {authorForm.formState.errors.root.message}
          </FormMessage>
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
    </Form>
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
