"use client";

import type { publishingSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import * as Icons from "@rectangular-labs/ui/components/icon";
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
  const [notesDraft, setNotesDraft] = useState("");
  const [useNextEarliest, setUseNextEarliest] = useState(true);
  const [customScheduleDraft, setCustomScheduleDraft] = useState("");

  useEffect(() => {
    if (!activeDialogFile) return;
    setNotesDraft(activeDialogFile.notes ?? "");
    if (activeDialogFile.scheduledFor) {
      setCustomScheduleDraft(activeDialogFile.scheduledFor);
    } else {
      setUseNextEarliest(true);
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

  return (
    <DialogDrawer isLoading={isSaving} onOpenChange={onOpenChange} open={open}>
      <div className="space-y-4">
        <DialogDrawerHeader>
          <DialogDrawerTitle>
            {activeDialogFile?.name?.replace(/\.md$/, "") ?? "Planner item"}
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
          <FieldLabel>Schedule</FieldLabel>
          <FieldContent className="gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={useNextEarliest}
                id="planner-schedule-next-earliest"
                onCheckedChange={(next) => setUseNextEarliest(next === true)}
              />
              <FieldLabel
                className="cursor-pointer font-normal"
                htmlFor="planner-schedule-next-earliest"
              >
                Schedule automatically
              </FieldLabel>
            </div>

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
                    [
                      { key: "status", value: "planned" },
                      ...(notesDraft.trim()
                        ? [{ key: "notes", value: notesDraft.trim() }]
                        : []),
                    ],
                    { closeDialog: true },
                  );
                }}
              >
                Accept suggestion
              </Button>
              <Button
                disabled={isSaving}
                onClick={() => {
                  if (!activeDialogFile) return;
                  applyMetadataUpdate(
                    activeDialogFile,
                    [
                      { key: "status", value: "suggestion-rejected" },
                      ...(notesDraft.trim()
                        ? [{ key: "notes", value: notesDraft.trim() }]
                        : []),
                    ],
                    { closeDialog: true },
                  );
                }}
                variant="outline"
              >
                Reject
              </Button>
            </>
          ) : (
            <Button
              disabled={isSaving}
              onClick={() => {
                if (!activeDialogFile) return;
                applyMetadataUpdate(
                  activeDialogFile,
                  [
                    ...(notesDraft.trim()
                      ? [{ key: "notes", value: notesDraft.trim() }]
                      : []),
                    { key: "scheduledFor", value: customScheduleDraft },
                  ],
                  {
                    closeDialog: true,
                  },
                );
              }}
            >
              Save
            </Button>
          )}
        </DialogDrawerFooter>
      </div>
    </DialogDrawer>
  );
}
