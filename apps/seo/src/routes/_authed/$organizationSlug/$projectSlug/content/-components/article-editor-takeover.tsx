"use client";

import {
  ARTICLE_TYPES,
  type ArticleType,
} from "@rectangular-labs/core/schemas/content-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import {
  Button,
  buttonVariants,
} from "@rectangular-labs/ui/components/ui/button";
import { Checkbox } from "@rectangular-labs/ui/components/ui/checkbox";
import {
  DialogDrawer,
  DialogDrawerDescription,
  DialogDrawerFooter,
  DialogDrawerHeader,
  DialogDrawerTitle,
} from "@rectangular-labs/ui/components/ui/dialog-drawer";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from "@rectangular-labs/ui/components/ui/item";
import { Label } from "@rectangular-labs/ui/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@rectangular-labs/ui/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@rectangular-labs/ui/components/ui/sheet";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { getApiClient, getApiClientRq } from "~/lib/api";
import { isoToDatetimeLocalValue } from "~/lib/datetime-local";
import { LoadingError } from "~/routes/_authed/-components/loading-error";

const ARTICLE_TYPE_UNSET_VALUE = "__unset__";
const ARTICLE_TYPE_OPTIONS = ARTICLE_TYPES.map((articleType) => ({
  value: articleType,
  label:
    articleType === "faq"
      ? "FAQ"
      : articleType
          .split("-")
          .map((segment) =>
            segment ? segment[0]?.toUpperCase() + segment.slice(1) : segment,
          )
          .join(" "),
}));

type SaveIndicatorState =
  | { status: "idle" }
  | { status: "saving" }
  | { status: "saved"; at: string }
  | { status: "error"; message: string };

async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(String(reader.result));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ArticleEditorTakeover({
  draftId,
  organizationSlug,
  organizationId,
  projectId,
}: {
  draftId: string;
  organizationSlug: string;
  organizationId: string;
  projectId: string;
}) {
  const [saveIndicator, setSaveIndicator] = useState<SaveIndicatorState>({
    status: "idle",
  });
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRegenerateOutlineOpen, setIsRegenerateOutlineOpen] = useState(false);
  const [isRegenerateArticleOpen, setIsRegenerateArticleOpen] = useState(false);
  const [draftDetails, setDraftDetails] = useState({
    title: "",
    description: "",
    slug: "",
    primaryKeyword: "",
    articleType: null as ArticleType | null,
    notes: "",
    scheduledFor: null as string | null,
  });

  const markdownSaveTimeoutRef = useRef<number | null>(null);
  const outlineSaveTimeoutRef = useRef<number | null>(null);
  const latestMarkdownRef = useRef<string>("");
  const latestOutlineRef = useRef<string>("");

  const {
    data: draftData,
    isLoading: isLoadingDraft,
    error: draftError,
    refetch: refetchDraft,
  } = useQuery(
    getApiClientRq().content.getDraft.queryOptions({
      input: {
        organizationIdentifier: organizationSlug,
        projectId,
        id: draftId,
      },
      enabled: !!draftId,
      refetchInterval: (context) => {
        const draft = context.state.data?.draft;
        if (
          draft?.status === "writing" ||
          draft?.status === "queued" ||
          draft?.status === "planning" ||
          draft?.status === "reviewing-writing"
        ) {
          return 8_000;
        }
        return false;
      },
    }),
  );
  const draft = draftData?.draft;
  const {
    data: generatingOutlineStatusData,
    isLoading: isLoadingGeneratingOutlineStatus,
  } = useQuery(
    getApiClientRq().task.getStatus.queryOptions({
      input: { id: draft?.outlineGeneratedByTaskRunId ?? "" },
      enabled: !!draft?.outlineGeneratedByTaskRunId,
    }),
  );
  const {
    data: generatingArticleStatusData,
    isLoading: isLoadingGeneratingArticleStatus,
  } = useQuery(
    getApiClientRq().task.getStatus.queryOptions({
      input: { id: draft?.generatedByTaskRunId ?? "" },
      enabled: !!draft?.generatedByTaskRunId,
    }),
  );
  console.log("generatingArticleStatusData", generatingArticleStatusData);
  const isGeneratingOutline =
    !!draft?.outlineGeneratedByTaskRunId &&
    !isLoadingGeneratingOutlineStatus &&
    (generatingOutlineStatusData?.status === "pending" ||
      generatingOutlineStatusData?.status === "running" ||
      generatingOutlineStatusData?.status === "queued");
  const isGeneratingArticle =
    !!draft?.generatedByTaskRunId &&
    !isLoadingGeneratingArticleStatus &&
    (generatingArticleStatusData?.status === "pending" ||
      generatingArticleStatusData?.status === "running" ||
      generatingArticleStatusData?.status === "queued");
  const isGenerating = !!isGeneratingArticle || isGeneratingOutline;
  const isOutlineGenerationFailed =
    generatingOutlineStatusData?.status === "failed" ||
    generatingOutlineStatusData?.status === "cancelled";
  const isArticleGenerationFailed =
    generatingArticleStatusData?.status === "failed" ||
    generatingArticleStatusData?.status === "cancelled";
  const isGenerationFailed =
    isOutlineGenerationFailed || isArticleGenerationFailed;

  const canEditDetails = !isGenerating && draft;

  useEffect(() => {
    if (!draft) return;
    setDraftDetails({
      title: draft.title ?? "",
      description: draft.description ?? "",
      slug: draft.slug ?? "",
      primaryKeyword: draft.primaryKeyword ?? "",
      articleType: draft.articleType ?? null,
      notes: draft.notes ?? "",
      scheduledFor: draft.scheduledFor
        ? isoToDatetimeLocalValue(draft.scheduledFor.toISOString())
        : null,
    });
    latestMarkdownRef.current = draft.contentMarkdown ?? "";
    latestOutlineRef.current = draft.outline ?? "";
  }, [draft]);

  const onUploadImage = async (file: File) => {
    const dataUrl = await fileToDataUrl(file);
    const result = await getApiClient().project.uploadProjectImage({
      id: projectId,
      organizationIdentifier: organizationId,
      kind: "content-image",
      files: [{ name: file.name, url: dataUrl }],
    });
    const uri = result.publicUris[0];
    if (!uri) throw new Error("Upload succeeded but returned no image URL");
    return uri;
  };

  const {
    mutate: updateDraft,
    mutateAsync: updateDraftAsync,
    isPending: isUpdatingDraft,
  } = useMutation(
    getApiClientRq().content.updateDraft.mutationOptions({
      onError: (e) => {
        setSaveIndicator({
          status: "error",
          message: e instanceof Error ? e.message : "Failed to save",
        });
        toast.error("Failed to save changes");
      },
      onSuccess: async () => {
        setSaveIndicator({ status: "saved", at: new Date().toISOString() });
        setIsRegenerateOutlineOpen(false);
        setIsRegenerateArticleOpen(false);

        await refetchDraft();
      },
    }),
  );
  const { mutate: markContent, isPending: isMarking } = useMutation(
    getApiClientRq().content.markDraft.mutationOptions({
      onError: () => toast.error("Failed to update status"),
      onSuccess: async () => {
        await refetchDraft();
      },
    }),
  );

  const saveDetails = () => {
    if (!draft) return;
    if (!canEditDetails) return;

    const nextTarget = (() => {
      // use next earliest available slot if no target date is set
      if (draftDetails.scheduledFor === null) return null;
      // if date is set we verify that it's valid
      const date = new Date(draftDetails.scheduledFor);
      if (Number.isNaN(date.getTime())) {
        toast.error("Invalid target scheduled date");
        return undefined;
      }
      return date;
    })();
    // if the target date is invalid, we don't save
    if (nextTarget === undefined) return;

    setSaveIndicator({ status: "saving" });
    updateDraft({
      organizationIdentifier: organizationSlug,
      projectId,
      id: draft.id,
      title: draftDetails.title.trim(),
      description: draftDetails.description.trim(),
      slug: draftDetails.slug.trim(),
      primaryKeyword: draftDetails.primaryKeyword.trim(),
      articleType: draftDetails.articleType ?? null,
      notes: draftDetails.notes.trim(),
      scheduledFor: nextTarget,
    });
  };

  const onMarkdownChange = (nextMarkdown: string) => {
    if (markdownSaveTimeoutRef.current) {
      window.clearTimeout(markdownSaveTimeoutRef.current);
    }
    markdownSaveTimeoutRef.current = window.setTimeout(() => {
      if (!draft) return;
      setSaveIndicator({ status: "saving" });
      updateDraft({
        organizationIdentifier: organizationSlug,
        projectId,
        id: draft.id,
        contentMarkdown: nextMarkdown,
      });
    }, 900);
  };

  const onOutlineChange = (nextOutline: string) => {
    setDraftDetails((prev) => ({ ...prev, outline: nextOutline }));
    if (outlineSaveTimeoutRef.current) {
      window.clearTimeout(outlineSaveTimeoutRef.current);
    }
    outlineSaveTimeoutRef.current = window.setTimeout(() => {
      if (!draft) return;
      setSaveIndicator({ status: "saving" });
      updateDraft({
        organizationIdentifier: organizationSlug,
        projectId,
        id: draft.id,
        outline: nextOutline.trim(),
      });
    }, 900);
  };

  const handleRegenerateOutline = async () => {
    if (!draft) return;
    try {
      setSaveIndicator({ status: "saving" });
      await updateDraftAsync({
        organizationIdentifier: organizationSlug,
        projectId,
        id: draft.id,
        notes: draftDetails.notes.trim(),
        outlineGeneratedByTaskRunId: null,
      });
      toast.success("Outline regeneration started");
    } catch {
      // okay to ignore errors here since we handle it in the mutation
    }
  };

  const handleRegenerateArticle = async () => {
    if (!draft) return;
    try {
      setSaveIndicator({ status: "saving" });
      await updateDraftAsync({
        organizationIdentifier: organizationSlug,
        projectId,
        id: draft.id,
        status: "queued",
        generatedByTaskRunId: null,
      });
      toast.success("Article regeneration started");
    } catch {
      // okay to ignore errors here since we handle it in the mutation
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            className={buttonVariants({ variant: "ghost", size: "sm" })}
            search={(prev) => ({ ...prev, draftId: undefined })}
            to="."
          >
            <Icons.X className="size-4" />
            Close
          </Link>

          <div className="min-w-0">
            <p className="truncate font-medium text-sm">
              {draft?.title ?? "Draft"}
            </p>
            {draft?.slug && (
              <p className="truncate text-muted-foreground text-xs">
                {draft.slug}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-muted-foreground text-xs">
          {(draft?.status === "suggested" ||
            draft?.status === "pending-review") && (
            <>
              <Button
                disabled={
                  (draft.status === "suggested" && !draft.outline) ||
                  (draft.status === "pending-review" && !draft.contentMarkdown)
                }
                isLoading={isMarking}
                onClick={() =>
                  markContent({
                    organizationIdentifier: organizationSlug,
                    projectId,
                    id: draft.id,
                    mark: "yes",
                  })
                }
                size="sm"
              >
                {draft.status === "suggested" && "Accept"}
                {draft.status === "pending-review" && "Approve"}
              </Button>
              <Button
                isLoading={isMarking}
                onClick={() =>
                  markContent({
                    organizationIdentifier: organizationSlug,
                    projectId,
                    id: draft.id,
                    mark: "no",
                  })
                }
                size="sm"
                variant="outline"
              >
                Reject
              </Button>
            </>
          )}

          <Button
            onClick={() => setIsDetailsOpen(true)}
            size="sm"
            variant="outline"
          >
            <Icons.Settings className="size-4" />
            Details
          </Button>

          <span className="inline-flex items-center gap-1">
            {saveIndicator.status === "saving" && (
              <>
                <Icons.Spinner className="size-3.5 animate-spin" />
                Saving…
              </>
            )}
            {saveIndicator.status === "saved" && (
              <>
                <Icons.Check className="size-3.5" />
                Saved {new Date(saveIndicator.at).toLocaleTimeString()}
              </>
            )}
            {saveIndicator.status === "error" && (
              <>
                <Icons.AlertTriangleIcon className="size-3.5" />
                Save failed
              </>
            )}
          </span>
        </div>
      </div>

      <LoadingError
        className="p-6"
        error={draftError}
        errorDescription="Something went wrong while loading this article. Please try again."
        errorTitle="Error loading article"
        isLoading={isLoadingDraft}
        onRetry={refetchDraft}
      />

      {draft && (
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
          <style>
            {`@media (max-width: 768px) {
                .milkdown .ProseMirror {
                  padding: 8px 8px 8px 90px;
                }
              }
              .milkdown .ProseMirror {
                overflow-y: auto;
              }`}
          </style>

          {isGenerating && (
            <Alert className="text-sm">
              <Icons.Timer />
              <AlertTitle>
                {isGeneratingOutline
                  ? "This outline is currently being generated"
                  : "This draft is currently being generated"}
              </AlertTitle>
              <AlertDescription>
                {isGeneratingOutline
                  ? "We will show the outline once it is ready."
                  : "We will show the article once it is ready."}
              </AlertDescription>
            </Alert>
          )}
          {isGenerationFailed && (
            <Item className="text-sm" variant="outline">
              <ItemMedia variant="icon">
                <Icons.AlertTriangleIcon className="size-4" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Generation failed</ItemTitle>
                <ItemDescription>
                  {isOutlineGenerationFailed
                    ? "Something went wrong while generating the outline. Please try again."
                    : "Something went wrong while generating the article. Please try again."}
                </ItemDescription>
              </ItemContent>
              <ItemActions>
                <Button
                  isLoading={isUpdatingDraft}
                  onClick={
                    isOutlineGenerationFailed
                      ? () => setIsRegenerateOutlineOpen(true)
                      : () => setIsRegenerateArticleOpen(true)
                  }
                  size="sm"
                  variant="outline"
                >
                  {isOutlineGenerationFailed
                    ? "Regenerate outline"
                    : "Regenerate article"}
                </Button>
              </ItemActions>
            </Item>
          )}

          {draft.status === "suggested" && (
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Outline</FieldLabel>
                <Button
                  disabled={isUpdatingDraft || isGeneratingOutline}
                  onClick={() => setIsRegenerateOutlineOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Regenerate outline
                </Button>
              </div>
              {isGeneratingOutline && (
                <FieldDescription>
                  Outline editing is disabled while the outline is being
                  generated.
                </FieldDescription>
              )}
              <FieldContent className="p-0">
                <MarkdownEditor
                  key={`outline-${draft.id}-${generatingOutlineStatusData?.status}-${draft.outlineGeneratedByTaskRunId}`}
                  markdown={draft.outline || ""}
                  onMarkdownChange={
                    !isGeneratingOutline ? onOutlineChange : undefined
                  }
                  readOnly={isGeneratingOutline}
                />
              </FieldContent>
            </Field>
          )}

          {draft.status !== "suggested" && (
            <Field className="h-full flex-1">
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Article</FieldLabel>
                <Button
                  disabled={isUpdatingDraft || isGeneratingArticle}
                  onClick={() => setIsRegenerateArticleOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Regenerate article
                </Button>
              </div>
              {isGeneratingArticle && (
                <FieldDescription>
                  Content editing is disabled while the article is being
                  generated.
                </FieldDescription>
              )}
              <FieldContent className="p-0">
                <MarkdownEditor
                  key={`${draft.id}-${generatingArticleStatusData?.status}-${draft.generatedByTaskRunId}`}
                  markdown={draft.contentMarkdown ?? ""}
                  onMarkdownChange={onMarkdownChange}
                  onUploadImage={onUploadImage}
                  readOnly={isGeneratingArticle}
                />
              </FieldContent>
            </Field>
          )}
        </div>
      )}

      <Sheet onOpenChange={setIsDetailsOpen} open={isDetailsOpen}>
        <SheetContent className="gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>Draft settings</SheetTitle>
            <SheetDescription>
              Edit title, slug, keyword, article type, description, notes, and
              release date.
            </SheetDescription>
          </SheetHeader>

          <div className="overflow-auto p-4">
            <FieldGroup className="gap-4">
              <Field>
                <FieldLabel htmlFor="draft-title">Title</FieldLabel>
                <Input
                  disabled={!canEditDetails}
                  id="draft-title"
                  onChange={(e) =>
                    setDraftDetails((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                  placeholder="Article title..."
                  value={draftDetails.title}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="draft-description">Description</FieldLabel>
                <Textarea
                  disabled={!canEditDetails}
                  id="draft-description"
                  onChange={(e) =>
                    setDraftDetails((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Meta description..."
                  rows={3}
                  value={draftDetails.description}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="draft-slug">Slug</FieldLabel>
                <Input
                  disabled={!canEditDetails}
                  id="draft-slug"
                  onChange={(e) =>
                    setDraftDetails((prev) => ({
                      ...prev,
                      slug: e.target.value,
                    }))
                  }
                  placeholder="/how-to-rank-on-google"
                  value={draftDetails.slug}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="draft-primary-keyword">
                  Primary keyword
                </FieldLabel>
                <Input
                  disabled={!canEditDetails}
                  id="draft-primary-keyword"
                  onChange={(e) =>
                    setDraftDetails((prev) => ({
                      ...prev,
                      primaryKeyword: e.target.value,
                    }))
                  }
                  placeholder="best crm for startups"
                  value={draftDetails.primaryKeyword}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="draft-article-type">
                  Article type
                </FieldLabel>
                <Select
                  disabled={!canEditDetails}
                  onValueChange={(value) =>
                    setDraftDetails((prev) => ({
                      ...prev,
                      articleType:
                        value === ARTICLE_TYPE_UNSET_VALUE
                          ? null
                          : (value as ArticleType),
                    }))
                  }
                  value={draftDetails.articleType ?? ARTICLE_TYPE_UNSET_VALUE}
                >
                  <SelectTrigger id="draft-article-type">
                    <SelectValue placeholder="Select article type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ARTICLE_TYPE_UNSET_VALUE}>
                      Not set
                    </SelectItem>
                    {ARTICLE_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="draft-target-date">
                  Target release date
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={draftDetails.scheduledFor === null}
                    disabled={!canEditDetails}
                    id="draft-target-next-slot"
                    onCheckedChange={(next) => {
                      const isChecked = next === true;
                      setDraftDetails((prev) => ({
                        ...prev,
                        scheduledFor: isChecked
                          ? null
                          : isoToDatetimeLocalValue(
                              new Date(
                                Date.now() + 24 * 60 * 60 * 1000,
                              ).toISOString(),
                            ),
                      }));
                    }}
                  />
                  <Label className="text-sm" htmlFor="draft-target-next-slot">
                    Next earliest available slot
                  </Label>
                </div>
                {draftDetails.scheduledFor !== null && (
                  <>
                    <Input
                      disabled={!canEditDetails}
                      id="draft-target-date"
                      onChange={(e) =>
                        setDraftDetails((prev) => ({
                          ...prev,
                          scheduledFor: e.target.value,
                        }))
                      }
                      type="datetime-local"
                      value={draftDetails.scheduledFor ?? ""}
                    />
                    <FieldDescription>
                      Uses your local timezone.
                    </FieldDescription>
                  </>
                )}
              </Field>

              {isGenerating && (
                <FieldDescription>
                  Settings are read-only while the generator is running.
                </FieldDescription>
              )}
            </FieldGroup>
          </div>

          <SheetFooter className="border-t">
            <Button
              disabled={!canEditDetails}
              isLoading={isUpdatingDraft}
              onClick={saveDetails}
            >
              Save settings
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <DialogDrawer
        onOpenChange={setIsRegenerateOutlineOpen}
        open={isRegenerateOutlineOpen}
      >
        <DialogDrawerHeader>
          <DialogDrawerTitle>Regenerate outline</DialogDrawerTitle>
          <DialogDrawerDescription>
            Update the notes and kick off a fresh outline.
          </DialogDrawerDescription>
        </DialogDrawerHeader>

        <Field>
          <FieldLabel htmlFor="outline-notes">Notes</FieldLabel>
          <Textarea
            id="outline-notes"
            onChange={(e) =>
              setDraftDetails((prev) => ({ ...prev, notes: e.target.value }))
            }
            placeholder="Add any notes that you want reflected in the outline..."
            rows={6}
            value={draftDetails.notes}
          />
        </Field>

        <DialogDrawerFooter className="gap-2">
          <Button
            disabled={isUpdatingDraft}
            onClick={handleRegenerateOutline}
            type="button"
          >
            Regenerate outline
          </Button>
          <Button
            onClick={() => setIsRegenerateOutlineOpen(false)}
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
        </DialogDrawerFooter>
      </DialogDrawer>

      <Sheet
        onOpenChange={setIsRegenerateArticleOpen}
        open={isRegenerateArticleOpen}
      >
        <SheetContent className="w-full gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b">
            <SheetTitle>Regenerate article</SheetTitle>
            <SheetDescription>
              Review the current outline or regenerate it before writing.
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 overflow-auto p-4">
            <Field>
              <div className="flex items-center justify-between gap-2">
                <FieldLabel>Outline</FieldLabel>
                <Button
                  disabled={isUpdatingDraft}
                  onClick={() => setIsRegenerateOutlineOpen(true)}
                  size="sm"
                  variant="outline"
                >
                  Regenerate outline
                </Button>
              </div>
              <FieldContent className="p-0">
                <MarkdownEditor
                  key={`outline-sheet-${draft?.id}-${draft?.outlineGeneratedByTaskRunId}`}
                  markdown={draft?.outline || ""}
                  onMarkdownChange={onOutlineChange}
                  readOnly={isGeneratingOutline}
                />
              </FieldContent>
            </Field>
          </div>

          <SheetFooter className="border-t">
            <Button
              disabled={isUpdatingDraft}
              onClick={handleRegenerateArticle}
            >
              Regenerate article
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
