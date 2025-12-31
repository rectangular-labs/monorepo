import {
  traverseNode,
  type WriteToFileMiddleware,
} from "@rectangular-labs/loro-file-system";
import type { LoroTree, LoroTreeNode } from "loro-crdt";
import type { publishingSettingsSchema } from "../../schemas/project-parsers";
import type { FsNodePayload, SeoFileStatus } from "./types";

export type WriteToFilePublishingContext = {
  publishingSettings: typeof publishingSettingsSchema.infer | null;
};

type PublishingCadence = NonNullable<
  WriteToFilePublishingContext["publishingSettings"]
>["cadence"];

function weekdayFromDate(date: Date): PublishingCadence["allowedDays"][number] {
  switch (date.getUTCDay()) {
    case 0:
      return "sun";
    case 1:
      return "mon";
    case 2:
      return "tue";
    case 3:
      return "wed";
    case 4:
      return "thu";
    case 5:
      return "fri";
    case 6:
      return "sat";
    default:
      return "mon";
  }
}

function computeNextAvailableScheduleIso({
  tree,
  cadence,
}: {
  tree: LoroTree<FsNodePayload>;
  cadence: PublishingCadence;
}): string | undefined {
  const { allowedDays, period, frequency } = cadence;
  if (allowedDays.length === 0) return undefined;

  const maxPerAllowedDay = (() => {
    const allowedCount = allowedDays.length;
    if (allowedCount <= 0) return 1;
    if (period === "daily") return frequency;
    if (period === "weekly") return Math.ceil(frequency / allowedCount);
    if (period === "monthly") return Math.ceil(frequency / (allowedCount * 4)); // roughly 4 weeks in a month
    throw new Error(`Invalid period: ${period}`);
  })();

  const usedByDay = new Map<string, number>();

  const root = tree.roots()[0] as LoroTreeNode<FsNodePayload> | undefined;
  if (!root) return undefined;
  const countableStatuses = new Set<string>([
    "planned",
    "generating",
    "pending-review",
    "scheduled",
  ] satisfies SeoFileStatus[]);
  traverseNode({
    node: root,
    callback: (node) => {
      if (node.data.get("type") === "file") {
        const status = node.data.get("status");
        const scheduledFor = node.data.get("scheduledFor");
        if (typeof status === "string" && countableStatuses.has(status)) {
          if (typeof scheduledFor === "string" && scheduledFor.trim() !== "") {
            const d = new Date(scheduledFor);
            if (!Number.isNaN(d.getTime())) {
              const dayKey = d.toISOString().slice(0, 10); // YYYY-MM-DD
              usedByDay.set(dayKey, (usedByDay.get(dayKey) ?? 0) + 1);
            }
          }
        }
      }
    },
  });

  const now = new Date();
  const cursor = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
      9,
      0,
      0,
    ),
  );
  // if 9am is in the pass, start from tomorrow
  if (cursor.getTime() < now.getTime()) {
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  // iterate over the next 365 days
  for (let i = 0; i < 365; ++i) {
    const weekday = weekdayFromDate(cursor);
    if (!allowedDays.includes(weekday)) {
      cursor.setUTCDate(cursor.getUTCDate() + 1);
      continue;
    }
    const dayKey = cursor.toISOString().slice(0, 10);
    const count = usedByDay.get(dayKey) ?? 0;
    if (count < maxPerAllowedDay) {
      const scheduled = new Date(cursor);
      scheduled.setUTCHours(9 + count * 2, 0, 0, 0);
      return scheduled.toISOString();
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return undefined;
}

export function addScheduledForWhenPlannedMiddleware(): WriteToFileMiddleware<
  FsNodePayload,
  WriteToFilePublishingContext
> {
  return async ({ ctx, next }) => {
    const status = ctx.getMetadata("status");
    if (status !== ("planned" satisfies SeoFileStatus)) {
      return await next();
    }

    const explicitScheduledFor = ctx.getMetadata("scheduledFor");
    if (!Number.isNaN(new Date(explicitScheduledFor ?? "-").getTime())) {
      // valid date string will be set, don't override
      return await next();
    }

    const existingNode = ctx.getExistingNode();
    const existingScheduledFor = existingNode?.data.get("scheduledFor");
    if (!Number.isNaN(new Date(existingScheduledFor ?? "-").getTime())) {
      // valid date string already exists, don't override
      return await next();
    }

    const cadence = ctx.context.publishingSettings?.cadence;
    if (!cadence) {
      return {
        success: false,
        message:
          "Publishing cadence is not configured (missing publishingSettings.cadence).",
      };
    }
    if (!cadence.allowedDays || cadence.allowedDays.length === 0) {
      return {
        success: false,
        message: "Publishing cadence is not configured (allowedDays is empty).",
      };
    }

    const scheduledFor = computeNextAvailableScheduleIso({
      tree: ctx.tree,
      cadence,
    });
    if (!scheduledFor) {
      return {
        success: false,
        message: "Failed to compute next available schedule slot.",
      };
    }
    ctx.setMetadata("scheduledFor", scheduledFor);
    return await next();
  };
}
