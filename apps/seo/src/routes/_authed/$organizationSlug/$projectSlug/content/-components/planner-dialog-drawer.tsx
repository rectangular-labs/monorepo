"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import type { publishingSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
import { MarkdownEditor } from "@rectangular-labs/ui/components/markdown-editor";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@rectangular-labs/ui/components/ui/accordion";
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
import type { TreeFile } from "~/lib/workspace/build-tree";

export function PlannerDialogDrawer({
  activeDialogFile,
  applyMetadataUpdate,
  isSaving,
  onOpenChange,
  open,
  publishingSettings,
}: {
  isSaving: boolean;
  activeDialogFile: TreeFile | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  publishingSettings: typeof publishingSettingsSchema.infer | null;
  applyMetadataUpdate: (
    file: TreeFile,
    metadata: { key: string; value: string }[],
    options?: { closeDialog?: boolean },
  ) => void;
}) {
  const [titleDraft, setTitleDraft] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [useNextEarliest, setUseNextEarliest] = useState(true);
  const [customScheduleDraft, setCustomScheduleDraft] = useState("");
  const [outlineDraft, setOutlineDraft] = useState("");

  useEffect(() => {
    if (!activeDialogFile) return;
    setTitleDraft(activeDialogFile.name.replace(/\.md$/i, ""));
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

  const buildMetadataUpdate = useMemo(() => {
    const baseName = activeDialogFile?.name ?? "";
    const normalizedTitle = titleDraft.trim();
    const nextName =
      normalizedTitle.length > 0
        ? normalizedTitle.toLowerCase().endsWith(".md")
          ? normalizedTitle
          : `${normalizedTitle}.md`
        : "";
    const shouldUpdateName =
      !!activeDialogFile && nextName.length > 0 && nextName !== baseName;

    const addSchedule =
      !useNextEarliest && customScheduleDraft.trim().length > 0;
    const scheduleDate = addSchedule ? new Date(customScheduleDraft) : null;
    const scheduleIso =
      scheduleDate && !Number.isNaN(scheduleDate.getTime())
        ? scheduleDate.toISOString()
        : null;

    return (status?: SeoFileStatus) => {
      const metadata: { key: string; value: string }[] = [];
      if (status) metadata.push({ key: "status", value: status });
      if (shouldUpdateName) metadata.push({ key: "name", value: nextName });
      if (notesDraft.trim())
        metadata.push({ key: "notes", value: notesDraft.trim() });
      if (scheduleIso)
        metadata.push({ key: "scheduledFor", value: scheduleIso });
      if (outlineDraft.trim())
        metadata.push({ key: "outline", value: outlineDraft.trim() });
      return metadata;
    };
  }, [
    activeDialogFile,
    customScheduleDraft,
    notesDraft,
    outlineDraft,
    titleDraft,
    useNextEarliest,
  ]);

  return (
    <DialogDrawer isLoading={isSaving} onOpenChange={onOpenChange} open={open}>
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

        {outline && (
          <Accordion collapsible type="single">
            <AccordionItem value="outline">
              <AccordionTrigger>Outline</AccordionTrigger>
              <AccordionContent className="max-h-[50vh] overflow-auto">
                <MarkdownEditor
                  key={activeDialogFile?.treeId ?? "outline"}
                  markdown={outline}
                  onMarkdownChange={(markdown) => setOutlineDraft(markdown)}
                />
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Field>
          <FieldLabel htmlFor="planner-notes">Notes</FieldLabel>
          <FieldContent>
            <Textarea
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
                  applyMetadataUpdate(
                    activeDialogFile,
                    buildMetadataUpdate("suggestion-rejected"),
                    { closeDialog: true },
                  );
                }}
                variant="outline"
              >
                Reject
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  applyMetadataUpdate(
                    activeDialogFile,
                    buildMetadataUpdate("planned"),
                    { closeDialog: true },
                  );
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
                  applyMetadataUpdate(
                    activeDialogFile,
                    buildMetadataUpdate("suggestion-rejected"),
                    {
                      closeDialog: true,
                    },
                  );
                }}
                variant="outline"
              >
                Remove planned article
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  applyMetadataUpdate(activeDialogFile, buildMetadataUpdate(), {
                    closeDialog: true,
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
