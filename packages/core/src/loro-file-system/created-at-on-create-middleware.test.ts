import type { WriteToFileMiddleware } from "@rectangular-labs/loro-file-system";
import { LoroTree } from "loro-crdt";
import { describe, expect, it, vi } from "vitest";
import type { WriteToFilePublishingContext } from "./add-scheduled-for-middlewares";
import { addCreatedAtOnCreateMiddleware } from "./created-at-on-create-middleware";
import type { FsNodePayload } from "./types";

type Context = Parameters<
  WriteToFileMiddleware<FsNodePayload, WriteToFilePublishingContext>
>[0]["ctx"];

describe("addCreatedAtOnCreateMiddleware", () => {
  it("sets createdAt on newly created nodes when missing", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T12:34:56.789Z"));

    let onCreate: Parameters<Context["addOnCreateNode"]>[0] | undefined;
    const ctx: Context = {
      tree: new LoroTree(),
      path: "/",
      content: undefined,
      createIfMissing: false,
      contentMapKey: "content",
      onCreateNode: undefined,
      context: { publishingSettings: null },
      addOnCreateNode: (fn) => {
        onCreate = fn;
      },
      getExistingNode: () => null,
      getMetadata: () => undefined,
      setMetadata: () => undefined,
      toMetadataArray: () => [],
    };
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addCreatedAtOnCreateMiddleware();
    const result = await mw({ ctx: ctx, next });

    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(onCreate).toBeDefined();

    const node = ctx.tree.createNode();
    const updated = await onCreate?.(node);
    expect(updated?.data.get("createdAt")).toBe("2026-01-02T12:34:56.789Z");

    vi.useRealTimers();
  });

  it("does not overwrite an existing createdAt", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-02T12:34:56.789Z"));

    let onCreate: Parameters<Context["addOnCreateNode"]>[0] | undefined;
    const ctx: Context = {
      tree: new LoroTree(),
      path: "/",
      content: undefined,
      createIfMissing: false,
      contentMapKey: "content",
      onCreateNode: undefined,
      context: { publishingSettings: null },
      addOnCreateNode: (fn) => {
        onCreate = fn;
      },
      getExistingNode: () => null,
      getMetadata: () => undefined,
      setMetadata: () => undefined,
      toMetadataArray: () => [],
    };
    const next = vi.fn(async () => ({ success: true as const }));

    const mw = addCreatedAtOnCreateMiddleware();
    const result = await mw({ ctx, next });
    expect(result).toEqual({ success: true });
    expect(next).toHaveBeenCalledTimes(1);
    expect(onCreate).toBeDefined();

    const node = ctx.tree.createNode();
    node.data.set("createdAt", "2020-01-01T00:00:00.000Z");
    const updated = await onCreate?.(node);
    expect(updated?.data.get("createdAt")).toBe("2020-01-01T00:00:00.000Z");

    vi.useRealTimers();
  });
});
