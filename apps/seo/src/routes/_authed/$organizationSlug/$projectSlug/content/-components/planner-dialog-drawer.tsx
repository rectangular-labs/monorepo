"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import type { publishingSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@rectangular-labs/ui/components/ui/alert";
import { Button } from "@rectangular-labs/ui/components/ui/button";
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
  FieldLabel,
} from "@rectangular-labs/ui/components/ui/field";
import { Input } from "@rectangular-labs/ui/components/ui/input";
import { Textarea } from "@rectangular-labs/ui/components/ui/textarea";
import { useEffect, useMemo, useState } from "react";
import { isoToDatetimeLocalValue } from "~/lib/datetime-local";
import { slugToFilePath } from "~/lib/workspace/slug";
import type { TreeFile } from "~/lib/workspace/build-tree";

export function PlannerDialogDrawer({
  activeDialogFile,
  isSaving,
  onOpenChange,
  open,
  publishingSettings,
  isRegeneratingOutline,
  onRegenerateOutline,
  onSaveEdits,
}: {
  isSaving: boolean;
  activeDialogFile: TreeFile | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishingSettings: typeof publishingSettingsSchema.infer | null;
  isRegeneratingOutline: boolean;
  onRegenerateOutline: (file: TreeFile) => void;
  onSaveEdits: (args: {
    file: TreeFile;
    status?: SeoFileStatus;
    title: string;
    description: string;
    slug: string;
    notes: string;
    scheduledForIso: string | null;
    outline: string;
    options?: { closeDialog?: boolean };
  }) => void;
}) {
  const [titleDraft, setTitleDraft] = useState("");
  const [descriptionDraft, setDescriptionDraft] = useState("");
  const [slugDraft, setSlugDraft] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState("");
  const [useNextEarliest, setUseNextEarliest] = useState(true);
  const [customScheduleDraft, setCustomScheduleDraft] = useState("");
  const [outlineDraft, setOutlineDraft] = useState("");

  useEffect(() => {
    if (!activeDialogFile) return;
    setTitleDraft(activeDialogFile.title ?? activeDialogFile.name.replace(/\.md$/i, ""));
    setDescriptionDraft(activeDialogFile.description ?? "");
    setSlugDraft(activeDialogFile.slug ?? activeDialogFile.path.replace(/\.md$/i, ""));
    setSlugError(null);
    setNotesDraft(activeDialogFile.notes ?? "");
    if (activeDialogFile.scheduledFor) {
      setUseNextEarliest(false);
      setCustomScheduleDraft(
        isoToDatetimeLocalValue(activeDialogFile.scheduledFor),
      );
    } else {
      setUseNextEarliest(true);
      setCustomScheduleDraft("");
    }
  }, [activeDialogFile]);

  const scheduleWarning = useMemo(() => {
    if (!publishingSettings) return undefined;
    if (customScheduleDraft) return undefined;

    if (publishingSettings.cadence.allowedDays.length === 0) {
      return "No allowed publishing days are configured.";
    }
    if (publishingSettings.cadence.frequency < 1) {
      return "Your publishing frequency is set 0.";
    }
    return undefined;
  }, [publishingSettings, customScheduleDraft]);

  const outline = useMemo(() => {
    return activeDialogFile?.outline?.trim() ?? "";
  }, [activeDialogFile?.outline]);

  const buildSavePayload = useMemo(() => {
    const addSchedule =
      !useNextEarliest && customScheduleDraft.trim().length > 0;
    const scheduleDate = addSchedule ? new Date(customScheduleDraft) : null;
    const scheduleIso =
      scheduleDate && !Number.isNaN(scheduleDate.getTime())
        ? scheduleDate.toISOString()
        : null;

    return {
      title: titleDraft,
      description: descriptionDraft,
      slug: slugDraft,
      notes: notesDraft,
      scheduledForIso: scheduleIso,
      outline: outlineDraft,
    };
  }, [
    customScheduleDraft,
    descriptionDraft,
    notesDraft,
    outlineDraft,
    slugDraft,
    titleDraft,
    useNextEarliest,
  ]);

  const validateSlug = () => {
    const result = slugToFilePath(slugDraft);
    if (!result.ok) {
      setSlugError(result.error.message);
      return false;
    }
    setSlugError(null);
    return true;
  };

  return (
    <DialogDrawer
      className={outline ? "sm:max-w-4xl" : undefined}
      isLoading={isSaving}
      onOpenChange={onOpenChange}
      open={open}
    >
      <div className="space-y-4">
        <DialogDrawerHeader>
          <DialogDrawerTitle>
            {titleDraft.trim() ||
              activeDialogFile?.name?.replace(/\.md$/i, "") ||
              "Planner item"}
          </DialogDrawerTitle>
          <DialogDrawerDescription>
            {activeDialogFile?.primaryKeyword
              ? `Target keyword: ${activeDialogFile.primaryKeyword}`
              : "Update notes and schedule."}
          </DialogDrawerDescription>
        </DialogDrawerHeader>

        {useNextEarliest && !publishingSettings && (
          <Alert>
            <Icons.AlertTriangleIcon />
            <AlertTitle>Publishing cadence is not configured</AlertTitle>
            <AlertDescription>
              Set allowed days in Publishing settings to enable automatic
              scheduling.
            </AlertDescription>
          </Alert>
        )}

        <Field>
          <FieldLabel htmlFor="planner-title">Title</FieldLabel>
          <FieldContent>
            <Input
              id="planner-title"
              onChange={(e) => setTitleDraft(e.target.value)}
              placeholder="Article title"
              value={titleDraft}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="planner-description">Description</FieldLabel>
          <FieldContent>
            <Textarea
              className="max-h-[15vh]"
              id="planner-description"
              onChange={(e) => setDescriptionDraft(e.target.value)}
              placeholder="Meta description"
              rows={3}
              value={descriptionDraft}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel htmlFor="planner-slug">Slug</FieldLabel>
          <FieldContent>
            <Input
              id="planner-slug"
              onBlur={validateSlug}
              onChange={(e) => {
                setSlugDraft(e.target.value);
                setSlugError(null);
              }}
              placeholder="/business/finance-automation"
              value={slugDraft}
            />
          </FieldContent>
          {slugError ? (
            <FieldDescription className="text-destructive">
              {slugError}
            </FieldDescription>
          ) : (
            <FieldDescription>
              Path without the <code>.md</code> extension (e.g.{" "}
              <code>/business/finance-automation</code>).
            </FieldDescription>
          )}
        </Field>

        {outline && (
          <Field>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel>Outline</FieldLabel>
              <Button
                disabled={
                  isSaving || isRegeneratingOutline || !activeDialogFile
                }
                isLoading={isRegeneratingOutline}
                onClick={() => {
                  if (!activeDialogFile) return;
                  onRegenerateOutline(activeDialogFile);
                }}
                size="sm"
                type="button"
                variant="ghost"
              >
                Regenerate outline
              </Button>
            </div>
            <FieldContent className="max-h-[40vh] overflow-auto p-0">
              <style>
                {`
                  .milkdown .ProseMirror {
                    padding: 8px 8px 8px 90px;
                  }
                `}
              </style>
              <MarkdownEditor
                key={activeDialogFile?.treeId ?? "outline"}
                markdown={outline}
                onMarkdownChange={(markdown) => setOutlineDraft(markdown)}
              />
            </FieldContent>
          </Field>
        )}

        <Field>
          <FieldLabel htmlFor="planner-notes">Notes</FieldLabel>
          <FieldContent>
            <Textarea
              className="max-h-[15vh]"
              id="planner-notes"
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder="Add notes for this article (optional)"
              rows={4}
              value={notesDraft}
            />
          </FieldContent>
        </Field>

        <Field>
          <FieldLabel>Schedule For</FieldLabel>
          <FieldContent className="gap-2">
            {activeDialogFile?.status === "suggested" && (
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={useNextEarliest}
                  id="planner-schedule-next-earliest"
                  onCheckedChange={(next) => {
                    const shouldAuto = next === true;
                    setUseNextEarliest(shouldAuto);
                    if (shouldAuto) {
                      setCustomScheduleDraft("");
                    }
                  }}
                />
                <FieldLabel
                  className="cursor-pointer font-normal"
                  htmlFor="planner-schedule-next-earliest"
                >
                  Next earliest slot
                </FieldLabel>
              </div>
            )}

            {useNextEarliest ? (
              <FieldDescription>
                Automatically schedules this item based on your publishing
                cadence.
              </FieldDescription>
            ) : (
              <Input
                id="planner-schedule"
                onChange={(e) => setCustomScheduleDraft(e.target.value)}
                type="datetime-local"
                value={customScheduleDraft}
              />
            )}
          </FieldContent>
        </Field>

        {scheduleWarning && (
          <Alert>
            <Icons.Info />
            <AlertTitle>Schedule warning</AlertTitle>
            <AlertDescription>{scheduleWarning}</AlertDescription>
          </Alert>
        )}

        <DialogDrawerFooter className="gap-2">
          {activeDialogFile?.status === "suggested" ? (
            <>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  if (!validateSlug()) return;
                  onSaveEdits({
                    file: activeDialogFile,
                    status: "suggestion-rejected",
                    ...buildSavePayload,
                    options: { closeDialog: true },
                  });
                }}
                variant="outline"
              >
                Reject
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  if (!validateSlug()) return;
                  onSaveEdits({
                    file: activeDialogFile,
                    status: "queued",
                    ...buildSavePayload,
                    options: { closeDialog: true },
                  });
                }}
              >
                Accept suggestion
              </Button>
            </>
          ) : (
            <>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  if (!validateSlug()) return;
                  onSaveEdits({
                    file: activeDialogFile,
                    status: "suggestion-rejected",
                    ...buildSavePayload,
                    options: { closeDialog: true },
                  });
                }}
                variant="outline"
              >
                Remove queued article
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  if (!validateSlug()) return;
                  onSaveEdits({
                    file: activeDialogFile,
                    ...buildSavePayload,
                    options: { closeDialog: true },
                  });
                }}
              >
                Save
              </Button>
            </>
          )}
        </DialogDrawerFooter>
      </div>
    </DialogDrawer>
  );
}
