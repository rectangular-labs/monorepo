import { LoroTree } from "loro-crdt";
import { describe, expect, it } from "vitest";
import type { BaseFileSystem } from "../index";
import { createNodesForPath } from "./create-nodes-for-path";

describe("createNodesForPath", () => {
  it("should create nodes along a path for a directory", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const result = await createNodesForPath({
      tree,
      path: "/dir1/dir2",
      finalNodeType: "dir",
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("dir2");
    expect(result.data.get("type")).toBe("dir");

    const parentNode = result.parent();
    expect(parentNode).toBeDefined();
    expect(parentNode?.data.get("name")).toBe("dir1");
    expect(parentNode?.data.get("type")).toBe("dir");

    const grandparentNode = parentNode?.parent();
    expect(grandparentNode).toBeDefined();
    expect(grandparentNode?.data.get("name")).toBe("__root__");
    expect(grandparentNode?.data.get("type")).toBe("dir");
  });

  it("should create nodes along a path for a file", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const result = await createNodesForPath({
      tree,
      path: "/dir1/dir2/file.txt",
      finalNodeType: "file",
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("file.txt");
    expect(result.data.get("type")).toBe("file");

    const parentNode = result.parent();
    expect(parentNode).toBeDefined();
    expect(parentNode?.data.get("name")).toBe("dir2");
    expect(parentNode?.data.get("type")).toBe("dir");

    const grandparentNode = parentNode?.parent();
    expect(grandparentNode).toBeDefined();
    expect(grandparentNode?.data.get("name")).toBe("dir1");
    expect(grandparentNode?.data.get("type")).toBe("dir");

    const greatGrandparentNode = grandparentNode?.parent();
    expect(greatGrandparentNode).toBeDefined();
    expect(greatGrandparentNode?.data.get("name")).toBe("__root__");
    expect(greatGrandparentNode?.data.get("type")).toBe("dir");
  });

  it("should reuse existing nodes when creating path", async () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const existingDir = rootNode.createNode();
    existingDir.data.set("name", "existing");
    existingDir.data.set("type", "dir");

    const result = await createNodesForPath({
      tree,
      path: "/existing/newdir",
      finalNodeType: "dir",
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("newdir");

    const parentNode = result.parent();
    expect(parentNode).toBeDefined();
    expect(parentNode?.data.get("name")).toBe("existing");
    expect(parentNode?.data.get("type")).toBe("dir");

    const grandparentNode = parentNode?.parent();
    expect(grandparentNode).toBeDefined();
    expect(grandparentNode?.data.get("name")).toBe("__root__");
    expect(grandparentNode?.data.get("type")).toBe("dir");

    expect(grandparentNode?.children()).toHaveLength(1);
    expect(grandparentNode?.children()?.[0]?.data.get("name")).toBe(
      parentNode?.data.get("name"),
    );
  });

  it("should handle single segment path", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const result = await createNodesForPath({
      tree,
      path: "/single",
      finalNodeType: "file",
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("single");
    expect(result.data.get("type")).toBe("file");

    const parentNode = result.parent();
    expect(parentNode).toBeDefined();
    expect(parentNode?.data.get("name")).toBe("__root__");
    expect(parentNode?.data.get("type")).toBe("dir");
  });

  it("should handle empty path by returning root", async () => {
    const tree = new LoroTree<BaseFileSystem>();

    const result = await createNodesForPath({
      tree,
      path: "/",
      finalNodeType: "dir",
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("__root__");
    expect(result.data.get("type")).toBe("dir");
  });

  it("should create nodes with onCreateNode", async () => {
    const tree = new LoroTree<BaseFileSystem & { extension: string }>();

    const result = await createNodesForPath({
      tree,
      path: "/test",
      finalNodeType: "dir",
      onCreateNode: (node) => {
        node.data.set("name", "onCreateNode");
        node.data.set("extension", "txt");
        return node;
      },
    });

    expect(result).toBeDefined();
    expect(result.data.get("name")).toBe("onCreateNode");
    expect(result.data.get("type")).toBe("dir");
    expect(result.data.get("extension")).toBe("txt");
  });
});
