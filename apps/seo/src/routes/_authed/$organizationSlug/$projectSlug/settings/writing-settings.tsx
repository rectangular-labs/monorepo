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
  Form,
  FormControl,
  FormField,
  FormItem,
  useFieldArray,
  useForm,
} from "@rectangular-labs/ui/components/ui/form";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useBlocker } from "@tanstack/react-router";
import { useCallback, useEffect, useState } from "react";
import { getApiClientRq } from "~/lib/api";
import { LoadingError } from "~/routes/_authed/-components/loading-error";
import { AuthorProfileCard } from "./-components/author-profile-card";
import { AuthorProfileModal } from "./-components/author-profile-modal";
import { FloatingToolbar } from "./-components/floating-toolbar";
import { MetadataCard } from "./-components/metadata-card";
import { MetadataModal } from "./-components/metadata-modal";
import { WritingSettingFormSchema } from "./-lib/writing-settings";

export const Route = createFileRoute(
  "/_authed/$organizationSlug/$projectSlug/settings/writing-settings",
)({
  component: WritingSettingsPage,
});

function WritingSettingsPage() {
  const { organizationSlug, projectSlug } = Route.useParams();
  const queryClient = useQueryClient();
  const {
    data: activeProject,
    isLoading,
    error,
  } = useQuery(
    getApiClientRq().project.getArticleSettings.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        identifier: projectSlug,
      },
    }),
  );
  const {
    mutate: updateWritingSettings,
    isPending: isUpdatingWritingSettings,
  } = useMutation(
    getApiClientRq().project.update.mutationOptions({
      onSuccess: async () => {
        toast.success("Article settings saved");
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getArticleSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );
  const { mutate: upsertAuthors, isPending: isUpsertingAuthors } = useMutation(
    getApiClientRq().project.upsertAuthors.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getApiClientRq().project.getArticleSettings.queryKey({
            input: {
              organizationIdentifier: organizationSlug,
              identifier: projectSlug,
            },
          }),
        });
      },
    }),
  );

  const form = useForm<WritingSettingFormSchema>({
    resolver: arktypeResolver(WritingSettingFormSchema),
    defaultValues: {
      version: "v1",
      brandVoice: "",
      customInstructions: "",
      metadata: [],
      authors: [],
    },
  });
  const {
    fields: metadataFields,
    append: appendMetadata,
    remove: removeMetadata,
    update: updateMetadata,
  } = useFieldArray({
    control: form.control,
    name: "metadata",
  });
  const [metadataIndex, setMetadataIndex] = useState<number | null>(null);
  const [isMetadataModalOpen, setIsMetadataModalOpen] = useState(false);
  const addMetadata = () => {
    setMetadataIndex(metadataFields.length);
    appendMetadata({ name: "", description: "" });
    setIsMetadataModalOpen(true);
  };
  const editMetadata = (index: number) => {
    setMetadataIndex(index);
    setIsMetadataModalOpen(true);
  };
  const removeMetadataDetails = (index: number | number[] | undefined) => {
    removeMetadata(index);
    setMetadataIndex(null);
  };

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
      metadata: activeProject?.writingSettings?.metadata ?? [],
      authors:
        activeProject?.authors.map((author) => ({
          ...author,
          title: author.title ?? "",
          bio: author.bio ?? "",
          avatarUri: author.avatarUri ?? "",
        })) ?? [],
    });
  }, [activeProject, form]);
  useEffect(() => {
    resetForm();
  }, [resetForm]);

  function handleSave(values: WritingSettingFormSchema) {
    if (!activeProject) return;

    const { authors, ...writingSettings } = values;

    updateWritingSettings({
      id: activeProject.id,
      organizationIdentifier: organizationSlug,
      writingSettings,
    });
    upsertAuthors({
      id: activeProject.id,
      organizationIdentifier: organizationSlug,
      authors,
    });
  }

  if (!activeProject || isLoading || error) {
    return (
      <LoadingError
        error={error}
        errorDescription="There was an error loading the project details. Please try again."
        errorTitle="Error loading project"
        isLoading={isLoading}
      />
    );
  }

  return (
    <Form {...form}>
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
              <FormField
                control={form.control}
                name="brandVoice"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Write in third person, use active voice, and keep it concise."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
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
              <FormField
                control={form.control}
                name="customInstructions"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder="Format all content with clear headers, use bold for key points, and include a call to action at the end."
                        rows={6}
                        {...field}
                      />
                    </FormControl>
                  </FormItem>
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
              <Button onClick={addAuthor} size="sm" variant="outline">
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

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <div className="space-y-1">
                <CardTitle>Metadata</CardTitle>
                <CardDescription>
                  Configure structured information that you&apos;ll like to be
                  included in the generated content.
                </CardDescription>
              </div>
              <Button onClick={addMetadata} size="sm" variant="outline">
                <Icons.Plus className="size-4" />
                <span className="hidden sm:block">Add metadata</span>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {metadataFields.length === 0 && (
              <p className="rounded-md border border-dashed p-4 text-muted-foreground text-sm">
                No metadata presets yet. Add a few to capture key facts or
                recurring scenarios.
              </p>
            )}

            {metadataFields.length > 0 && (
              <div className="grid gap-3 md:grid-cols-2">
                {metadataFields.map((metadata, index) => (
                  <MetadataCard
                    key={metadata.id}
                    metadata={metadata}
                    onClick={() => editMetadata(index)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <FloatingToolbar
          isSaving={isUpdatingWritingSettings || isUpsertingAuthors}
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

      <MetadataModal
        form={form}
        metadataIndex={metadataIndex}
        open={isMetadataModalOpen}
        removeMetadata={removeMetadataDetails}
        setOpen={setIsMetadataModalOpen}
        updateMetadata={updateMetadata}
      />
    </Form>
  );
}
