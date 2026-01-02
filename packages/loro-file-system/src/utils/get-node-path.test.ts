import { LoroTree } from "loro-crdt";
import { describe, expect, it } from "vitest";
import type { BaseFileSystem } from "../index";
import { createNodesForPath } from "./create-nodes-for-path";
import { getNodePath } from "./get-node-path";

describe("getNodePath", () => {
  it("returns '/' for the root node", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const root = tree.createNode();
    root.data.set("name", "__root__");
    root.data.set("type", "dir");

    expect(getNodePath(root)).toBe("/");
  });

  it("returns the full path for a nested file", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const node = await createNodesForPath({
      tree,
      path: "/dir/subdir/file.txt",
      finalNodeType: "file",
    });

    expect(getNodePath(node)).toBe("/dir/subdir/file.txt");
  });

  it("returns the full path for a nested directory", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const node = await createNodesForPath({
      tree,
      path: "/dir/subdir",
      finalNodeType: "dir",
    });

    expect(getNodePath(node)).toBe("/dir/subdir");
  });
});
