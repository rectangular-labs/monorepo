"use client";

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@rectangular-labs/ui/components/ui/card";
import type { WritingSettingFormSchema } from "../-lib/writing-settings";

export function MetadataCard({
  metadata,
  onClick,
}: {
  metadata: WritingSettingFormSchema["metadata"][number];
  onClick: () => void;
}) {
  return (
    <Card className="relative">
      <button className="absolute inset-0" onClick={onClick} type="button">
        <span className="sr-only">
          Edit {metadata.name || "metadata"} preset
        </span>
      </button>
      <CardHeader>
        <CardTitle>{metadata.name || "Untitled metadata"}</CardTitle>
        {metadata.description && (
          <CardDescription className="line-clamp-3">
            {metadata.description}
          </CardDescription>
        )}
      </CardHeader>
    </Card>
  );
}
