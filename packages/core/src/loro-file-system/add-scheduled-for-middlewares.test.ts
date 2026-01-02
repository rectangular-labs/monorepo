import {
  resolvePath,
  type WriteToFileMiddleware,
  writeToFile,
} from "@rectangular-labs/loro-file-system";
import { LoroTree } from "loro-crdt";
import { describe, expect, it, vi } from "vitest";
import {
  addScheduledForWhenQueuedMiddleware,
  type WriteToFilePublishingContext,
} from "./add-scheduled-for-middlewares";
import type { FsNodePayload } from "./types";

type Context = Parameters<
  WriteToFileMiddleware<FsNodePayload, WriteToFilePublishingContext>
>[0]["ctx"];
type PublishingSettings = NonNullable<
  WriteToFilePublishingContext["publishingSettings"]
>;

const basePublishingSettings: Pick<
  PublishingSettings,
  "version" | "requireContentReview" | "requireSuggestionReview"
> = {
  version: "v1",
  requireContentReview: false,
  requireSuggestionReview: false,
};

async function createFileNode(tree: LoroTree<FsNodePayload>, path: string) {
  await writeToFile({
    tree,
    path,
    content: "",
    createIfMissing: true,
    metadata: [],
  });
  const node = resolvePath({ tree, path });
  if (!node) {
    throw new Error(`Node not found at path ${path}`);
  }
  return node;
}

function makeCtx({
  metadata,
  publishingSettings,
  tree,
  path,
}: {
  metadata: Record<string, unknown>;
  tree: LoroTree<FsNodePayload>;
  path: string;
  publishingSettings: WriteToFilePublishingContext["publishingSettings"];
}): Context {
  const md = new Map<string, unknown>(Object.entries(metadata));
  const node = resolvePath({ tree, path });
  if (!node) {
    throw new Error(`Node not found at path ${path}`);
  }
  return {
    tree,
    path,
    content: undefined,
    createIfMissing: false,
    contentMapKey: "content",
    onCreateNode: undefined,
    context: { publishingSettings },
    addOnCreateNode: () => undefined,
    getMetadata: (k: string) => {
      const v = md.get(k);
      return typeof v === "string" ? v : undefined;
    },
    setMetadata: (k: string, v: string) => {
      md.set(k, v);
    },
    getExistingNode: () => node,
    toMetadataArray: () =>
      Array.from(md.entries()).map(([key, value]) => ({
        key,
        value: String(value ?? ""),
      })),
  };
}

describe("addScheduledForWhenQueuedMiddleware", () => {
  it("calls next() when status is not queued", async () => {
    const ctx = makeCtx({
      metadata: { status: "draft" },
      publishingSettings: null,
      tree: new LoroTree(),
      path: "/",
    });
    const next = vi.fn(async () => ({ success: true as const }));
    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.getMetadata("scheduledFor")).toBeUndefined();
  });

  it("does not override an explicitly provided valid scheduledFor", async () => {
    const tree = new LoroTree<FsNodePayload>();
    await createFileNode(tree, "/post.md");
    const explicit = "2026-01-05T09:00:00.000Z";
    const ctx = makeCtx({
      metadata: { status: "queued", scheduledFor: explicit },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: { allowedDays: ["mon"], period: "daily", frequency: 1 },
      },
      path: "/post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.getMetadata("scheduledFor")).toBe(explicit);
  });

  it("does not override an existing node scheduledFor when explicit scheduledFor is invalid", async () => {
    const tree = new LoroTree<FsNodePayload>();
    const existing = await createFileNode(tree, "/post.md");
    existing.data.set("scheduledFor", "2026-01-05T09:00:00.000Z");
    const ctx = makeCtx({
      metadata: { status: "queued", scheduledFor: "not-a-date" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: { allowedDays: ["mon"], period: "daily", frequency: 1 },
      },
      path: "/post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(ctx.getMetadata("scheduledFor")).toBe("not-a-date");
  });

  it("returns a clear error if cadence is missing", async () => {
    const tree = new LoroTree<FsNodePayload>();
    await createFileNode(tree, "/post.md");
    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: null,
      path: "/post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({
      success: false,
      message:
        "Publishing cadence is not configured (missing publishingSettings.cadence).",
    });
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("returns a clear error if cadence.allowedDays is empty", async () => {
    const tree = new LoroTree<FsNodePayload>();
    await createFileNode(tree, "/post.md");
    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: { allowedDays: [], period: "daily", frequency: 1 },
      },
      path: "/post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({
      success: false,
      message: "Publishing cadence is not configured (allowedDays is empty).",
    });
    expect(next).toHaveBeenCalledTimes(0);
  });

  it("computes the next available slot on an allowed day, accounting for per-day capacity and time slots", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    const dayKey = "2026-01-05";
    const tree = new LoroTree<FsNodePayload>();
    const scheduled1 = await createFileNode(tree, "/scheduled-1.md");
    scheduled1.data.set("status", "queued");
    scheduled1.data.set("scheduledFor", `${dayKey}T09:00:00.000Z`);
    const scheduled2 = await createFileNode(tree, "/scheduled-2.md");
    scheduled2.data.set("status", "scheduled");
    scheduled2.data.set("scheduledFor", `${dayKey}T11:00:00.000Z`);
    const notCounted1 = await createFileNode(tree, "/not-counted-1.md");
    notCounted1.data.set("status", "published");
    notCounted1.data.set("scheduledFor", `${dayKey}T13:00:00.000Z`);
    const notCounted2 = await createFileNode(tree, "/not-counted-2.md");
    notCounted2.data.set("status", "queued");
    notCounted2.data.set("scheduledFor", "not-a-date");
    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: { allowedDays: ["mon"], period: "daily", frequency: 3 },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    // 3 already counted for the day, so next slot is the next allowed day (next Monday) at 9am UTC
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-12T09:00:00.000Z");

    vi.useRealTimers();
  });

  it("starts from tomorrow if today's 9am UTC is already in the past", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T10:00:00.000Z")); // Monday, after 9am UTC

    const tree = new LoroTree<FsNodePayload>();
    await createFileNode(tree, "/new-post.md");
    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: { allowedDays: ["mon", "tue"], period: "daily", frequency: 1 },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-06T09:00:00.000Z"); // Tuesday 9am

    vi.useRealTimers();
  });

  it("schedules weekly cadences only on allowed days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 1 scheduled item, the next slot should be Monday 11am.
    const tree = new LoroTree<FsNodePayload>();
    const monday = "2026-01-05";
    const existing1 = await createFileNode(tree, "/existing-1.md");
    existing1.data.set("status", "queued");
    existing1.data.set("scheduledFor", `${monday}T09:00:00.000Z`);

    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: {
          allowedDays: ["mon", "wed"],
          period: "weekly",
          frequency: 3,
        },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-05T11:00:00.000Z"); // Monday 11am

    vi.useRealTimers();
  });

  it("schedules weekly cadences only on allowed days and respects per-day capacity derived from frequency", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 2 scheduled items, the next slot should be Wednesday 9am.
    const tree = new LoroTree<FsNodePayload>();
    const monday = "2026-01-05";
    const existing1 = await createFileNode(tree, "/existing-1.md");
    existing1.data.set("status", "queued");
    existing1.data.set("scheduledFor", `${monday}T09:00:00.000Z`);
    const existing2 = await createFileNode(tree, "/existing-2.md");
    existing2.data.set("status", "scheduled");
    existing2.data.set("scheduledFor", `${monday}T11:00:00.000Z`);
    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: {
          allowedDays: ["mon", "wed"],
          period: "weekly",
          frequency: 3,
        },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-07T09:00:00.000Z"); // Wednesday 9am

    vi.useRealTimers();
  });
  it("schedules weekly cadences will bump to following week if no slots are available", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // weekly frequency=3, allowedDays=[mon, wed] => maxPerAllowedDay=ceil(3/2)=2
    // If Monday already has 2 scheduled items, and Wednesday already has 1 scheduled item, the next slot should be following week's Monday 9am.
    const tree = new LoroTree<FsNodePayload>();
    const monday = "2026-01-05";
    const wednesday = "2026-01-07";
    const existing1 = await createFileNode(tree, "/existing-1.md");
    existing1.data.set("status", "queued");
    existing1.data.set("scheduledFor", `${monday}T09:00:00.000Z`);
    const existing2 = await createFileNode(tree, "/existing-2.md");
    existing2.data.set("status", "scheduled");
    existing2.data.set("scheduledFor", `${monday}T11:00:00.000Z`);
    const existing3 = await createFileNode(tree, "/existing-3.md");
    existing3.data.set("status", "scheduled");
    existing3.data.set("scheduledFor", `${wednesday}T09:00:00.000Z`);
    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: {
          allowedDays: ["mon", "wed"],
          period: "weekly",
          frequency: 3,
        },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-12T09:00:00.000Z"); // following week's Monday 9am

    vi.useRealTimers();
  });

  it("schedules monthly cadences only on allowed days", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // monthly frequency=7, allowedDays=[tue, thu] => maxPerAllowedDay=ceil(7/(2*4))=1
    // If Tuesday and Thursday already has 1 scheduled item, the next slot should be the following week's Tuesday 11am.
    const tree = new LoroTree<FsNodePayload>();
    const tuesday = "2026-01-06";
    const thursday = "2026-01-08";
    const existing1 = await createFileNode(tree, "/existing-1.md");
    existing1.data.set("status", "queued");
    existing1.data.set("scheduledFor", `${tuesday}T09:00:00.000Z`);
    const existing2 = await createFileNode(tree, "/existing-2.md");
    existing2.data.set("status", "scheduled");
    existing2.data.set("scheduledFor", `${thursday}T09:00:00.000Z`);
    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: {
          allowedDays: ["tue", "thu"],
          period: "monthly",
          frequency: 7,
        },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-01-13T09:00:00.000Z"); // following week's Tuesday 9am

    vi.useRealTimers();
  });

  it("schedules monthly cadences will bump to following month if no slots are available", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-05T08:00:00.000Z")); // Monday, before 9am UTC

    // monthly frequency=3, allowedDays=[tue, thu] => maxPerAllowedDay=ceil(3/(2*4))=1
    // If Tuesday, Thursday, and the following week's Tuesday already has 1 scheduled item, the next slot should be following month's Tuesday 9am.
    const tree = new LoroTree<FsNodePayload>();
    const tuesday = "2026-01-06";
    const thursday = "2026-01-08";
    const followingTuesday = "2026-01-13";
    const existing1 = await createFileNode(tree, "/existing-1.md");
    existing1.data.set("status", "queued");
    existing1.data.set("scheduledFor", `${tuesday}T09:00:00.000Z`);
    const existing2 = await createFileNode(tree, "/existing-2.md");
    existing2.data.set("status", "scheduled");
    existing2.data.set("scheduledFor", `${thursday}T09:00:00.000Z`);
    const existing3 = await createFileNode(tree, "/existing-3.md");
    existing3.data.set("status", "scheduled");
    existing3.data.set("scheduledFor", `${followingTuesday}T09:00:00.000Z`);
    await createFileNode(tree, "/new-post.md");

    const ctx = makeCtx({
      metadata: { status: "queued" },
      tree,
      publishingSettings: {
        ...basePublishingSettings,
        cadence: {
          allowedDays: ["tue", "thu"],
          period: "monthly",
          frequency: 3,
        },
      },
      path: "/new-post.md",
    });
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addScheduledForWhenQueuedMiddleware();
    const result = await mw({ ctx, next });

    expect(result).toEqual({ success: true });
    expect(ctx.getMetadata("scheduledFor")).toBe("2026-02-03T09:00:00.000Z"); // Following month's Tuesday 9am

    vi.useRealTimers();
  });
});
