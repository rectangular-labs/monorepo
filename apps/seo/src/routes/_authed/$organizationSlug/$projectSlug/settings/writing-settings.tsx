import { getExtensionFromMimeType } from "@rectangular-labs/core/project/get-extension-from-mimetype";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import {
  arktypeResolver,
  Controller,
  Field,
  FieldError,
  FieldLabel,
  useFieldArray,
  useForm,
} from "@rectangular-labs/ui/components/ui/field";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { convertBlobUrlToDataUrl } from "~/lib/url";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { AuthorProfileCard } from "./-components/author-profile-card";
import { AuthorProfileModal } from "./-components/author-profile-modal";
import { FloatingToolbar } from "./-components/floating-toolbar";
import { WritingSettingFormSchema } from "./-lib/writing-settings";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/writing-settings",
)({
  component: WritingSettingsPage,
});

function WritingSettingsPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: activeProject, error } = useSuspenseQuery(
    getApiClientRq().project.getWritingSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const {
    mutateAsync: updateWritingSettings,
    isPending: isUpdatingWritingSettings,
  } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getWritingSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );
  const { mutateAsync: upsertAuthors, isPending: isUpsertingAuthors } =
    useMutation(
      getApiClientRq().project.upsertAuthors.mutationOptions({
        onError: (error) => {
          form.setError("root", { message: error.message });
        },
      }),
    );

  const {
    mutateAsync: uploadAuthorAvatars,
    isPending: isUploadingAuthorAvatars,
  } = useMutation(
    getApiClientRq().project.uploadProjectImage.mutationOptions({
      onError: (error) => {
        form.setError("root", { message: error.message });
      },
    }),
  );

  const form = useForm<WritingSettingFormSchema>({
    resolver: arktypeResolver(WritingSettingFormSchema),
    defaultValues: {
      version: "v1",
      brandVoice: activeProject?.writingSettings?.brandVoice ?? "",
      customInstructions:
        activeProject?.writingSettings?.customInstructions ?? "",
      authors:
        activeProject?.authors.map((author) => ({
          ...author,
          title: author.title ?? "",
          bio: author.bio ?? "",
          avatarUri: author.avatarUri ?? "",
        })) ?? [],
    },
  });

  const {
    fields: authorFields,
    remove: removeAuthor,
    append: appendAuthor,
    update: updateAuthor,
  } = useFieldArray({
    control: form.control,
    name: "authors",
  });
  const [authorIndex, setAuthorIndex] = useState<number | null>(null);
  const [isAuthorProfileModalOpen, setIsAuthorProfileModalOpen] =
    useState(false);
  const addAuthor = () => {
    setAuthorIndex(authorFields.length);
    appendAuthor({
      name: "",
      title: "",
      bio: "",
      avatarUri: "",
      socialLinks: [],
    });
    setIsAuthorProfileModalOpen(true);
  };
  const editAuthor = (index: number) => {
    setAuthorIndex(index);
    setIsAuthorProfileModalOpen(true);
  };
  const removeAuthorDetails = (index: number | number[] | undefined) => {
    removeAuthor(index);
    setAuthorIndex(null);
  };

  const isDirty = form.formState.isDirty;
  useBlocker({
    shouldBlockFn: () => isDirty,
    enableBeforeUnload: isDirty,
  });

  const resetForm = useCallback(() => {
    if (!activeProject) return;
    form.reset({
      version: "v1",
      brandVoice: activeProject?.writingSettings?.brandVoice ?? "",
      customInstructions:
        activeProject?.writingSettings?.customInstructions ?? "",
      authors:
        activeProject?.authors.map((author) => ({
          ...author,
          title: author.title ?? "",
          bio: author.bio ?? "",
          avatarUri: author.avatarUri ?? "",
        })) ?? [],
    });
  }, [activeProject, form]);

  async function handleSave(values: WritingSettingFormSchema) {
    if (!activeProject) return;

    let { authors, ...writingSettings } = values;

    const authorPfpToUpload = await Promise.all(
      authors.map(async (author) => {
        if (author.avatarUri.startsWith("blob:")) {
          const mimeType = await fetch(author.avatarUri)
            .then((res) => res.blob())
            .then((blob) => blob.type);
          const blob = await convertBlobUrlToDataUrl(author.avatarUri);
          return {
            ...author,
            url: blob,
            fileName: `${author.name}.${getExtensionFromMimeType(mimeType)}`,
          };
        }
        return author;
      }),
    );

    if (authorPfpToUpload.length > 0) {
      const result = await uploadAuthorAvatars({
        id: activeProject.id,
        organizationIdentifier: organizationSlug,
        kind: "author-avatar",
        files: authorPfpToUpload
          .filter((author) => "url" in author)
          .map((author) => ({
            name: author.fileName,
            url: author.url,
          })),
      });
      let currentIndex = 0;
      authors = authorPfpToUpload.map((author) => {
        if ("url" in author) {
          return {
            ...author,
            avatarUri: result.publicUris[currentIndex++] ?? "",
          };
        }
        return author;
      });
    }

    await Promise.all([
      updateWritingSettings({
        id: activeProject.id,
        organizationIdentifier: organizationSlug,
        writingSettings,
      }),
      upsertAuthors({
        id: activeProject.id,
        organizationIdentifier: organizationSlug,
        authors,
      }),
    ]);

    toast.success("Article settings saved");
    await queryClient.invalidateQueries({
      queryKey: getApiClientRq().project.getWritingSettings.queryKey({
        input: {
          organizationIdentifier: organizationSlug,
          identifier: projectSlug,
        },
      }),
    });
  }

  if (!activeProject || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading the project details. Please try again."
        errorTitle="Error loading project"
        isLoading={false}
      />
    );
  }

  return (
    <>
      <form
        className="relative w-full space-y-6"
        onSubmit={form.handleSubmit(handleSave)}
      >
        <div className="space-y-2">
          <h1 className="font-semibold text-3xl tracking-tight">
            Writing Settings
          </h1>
          <p className="text-muted-foreground">
            Configure brand voice, author profiles, and reusable metadata
            presets for generated content.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Brand voice</CardTitle>
              <CardDescription>
                Tone, style, persona, and any linguistic guidelines for how
                content should read.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="brandVoice"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className="sr-only"
                      htmlFor="writing-settings-brandVoice"
                    >
                      Brand voice
                    </FieldLabel>
                    <Textarea
                      id="writing-settings-brandVoice"
                      placeholder="Write in third person, use active voice, and keep it concise."
                      rows={6}
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Custom instructions</CardTitle>
              <CardDescription>
                Reusable instructions applied to all articles: formatting, CTAs,
                links, or any do/don'ts.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Controller
                control={form.control}
                name="customInstructions"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel
                      className="sr-only"
                      htmlFor="writing-settings-customInstructions"
                    >
                      Custom instructions
                    </FieldLabel>
                    <Textarea
                      id="writing-settings-customInstructions"
                      placeholder="Format all content with clear headers, use bold for key points, and include a call to action at the end."
                      rows={6}
                      {...field}
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Author profiles</CardTitle>
                <CardDescription>
                  Manage author profiles for your content.
                </CardDescription>
              </div>
              <Button
                onClick={addAuthor}
                size="sm"
                type="button"
                variant="outline"
              >
                <Icons.Plus className="size-4" />
                <span className="hidden sm:block">Add author</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {authorFields.length === 0 && (
              <p className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                No authors yet. Add at least one profile for better E-E-A-T.
              </p>
            )}

            {authorFields.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {authorFields.map((author, index) => (
                  <AuthorProfileCard
                    author={author}
                    key={author.id}
                    onClick={() => editAuthor(index)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <FloatingToolbar
          errors={form.formState.errors.root?.message}
          isSaving={
            isUpdatingWritingSettings ||
            isUpsertingAuthors ||
            isUploadingAuthorAvatars
          }
          isVisible={isDirty}
          onCancel={resetForm}
        />
      </form>

      <AuthorProfileModal
        authorIndex={authorIndex}
        form={form}
        open={isAuthorProfileModalOpen}
        removeAuthor={removeAuthorDetails}
        setOpen={setIsAuthorProfileModalOpen}
        updateAuthor={updateAuthor}
      />
    </>
  );
}
