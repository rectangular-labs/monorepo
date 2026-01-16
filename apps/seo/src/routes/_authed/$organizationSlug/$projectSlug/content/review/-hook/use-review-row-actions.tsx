"use client";

import type { SeoFileStatus } from "@rectangular-labs/core/schemas/content-parsers";
import { Button } from "@rectangular-labs/ui/components/ui/button";
import { toast } from "@rectangular-labs/ui/components/ui/sonner";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { getApiClientRq } from "~/lib/api";

export function useReviewRowActions({
  organizationSlug,
  projectId,
  onMarked,
}: {
  organizationSlug: string;
  projectId: string;
  onMarked: () => Promise<unknown>;
}) {
  const [markingDraftIds, setMarkingDraftIds] = useState<Set<string>>(
    () => new Set(),
  );

  const { mutate: markContent } = useMutation(
    getApiClientRq().content.markDraft.mutationOptions({
      onError: () => toast.error("Failed to update review status"),
      onSuccess: async () => {
        await onMarked();
      },
    }),
  );

  const getRowActions = useCallback(
    (row: { id: string; status: SeoFileStatus | "published" }) => {
      const isMarking = markingDraftIds.has(row.id);

      const triggerMark = (mark: "yes" | "no") => {
        setMarkingDraftIds((prev) => new Set(prev).add(row.id));
        markContent(
          {
            organizationIdentifier: organizationSlug,
            projectId,
            id: row.id,
            mark,
          },
          {
            onSettled: () =>
              setMarkingDraftIds((prev) => {
                const next = new Set(prev);
                next.delete(row.id);
                return next;
              }),
          },
        );
      };

      if (row.status === "suggested") {
        return (
          <div className="flex items-center gap-2">
            <Button
              disabled={isMarking}
              onClick={(e) => {
                e.stopPropagation();
                triggerMark("yes");
              }}
              size="sm"
              type="button"
            >
              Accept
            </Button>
            <Button
              disabled={isMarking}
              onClick={(e) => {
                e.stopPropagation();
                triggerMark("no");
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Reject
            </Button>
          </div>
        );
      }

      if (row.status === "pending-review") {
        return (
          <div className="flex items-center gap-2">
            <Button
              disabled={isMarking}
              onClick={(e) => {
                e.stopPropagation();
                triggerMark("yes");
              }}
              size="sm"
              type="button"
            >
              Approve
            </Button>
            <Button
              disabled={isMarking}
              onClick={(e) => {
                e.stopPropagation();
                triggerMark("no");
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              Reject
            </Button>
          </div>
        );
      }

      return null;
    },
    [markContent, markingDraftIds, organizationSlug, projectId],
  );

  return { getRowActions };
}
