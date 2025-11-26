import { LoroTree } from "loro-crdt";
import { describe, expect, it } from "vitest";
import type { BaseFileSystem } from "../index";
import { resolvePath } from "./resolve-path";

describe("resolvePath", () => {
  it("should return root node for empty path", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const result = resolvePath({ tree, path: "/" });
    expect(result).not.toBeNull();
    expect(result?.data.get("name")).toBe("__root__");
  });

  it("should create root node if it doesn't exist", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const result = resolvePath({ tree, path: "/" });
    expect(result).not.toBeNull();
    expect(result?.data.get("name")).toBe("__root__");
    expect(result?.data.get("type")).toBe("dir");
  });

  it("should resolve path to existing node", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const childNode = rootNode.createNode();
    childNode.data.set("name", "test");
    childNode.data.set("type", "file");

    const result = resolvePath({ tree, path: "/test" });
    expect(result).not.toBeNull();
    expect(result?.data.get("name")).toBe("test");
    expect(result?.data.get("type")).toBe("file");
  });

  it("should resolve nested path", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "dir");
    dirNode.data.set("type", "dir");

    const fileNode = dirNode.createNode();
    fileNode.data.set("name", "file");
    fileNode.data.set("type", "file");

    const result = resolvePath({ tree, path: "/dir/file" });
    expect(result).not.toBeNull();
    expect(result?.data.get("name")).toBe("file");
  });

  it("should return null for non-existent paths", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const result = resolvePath({ tree, path: "/nonexistent" });
    expect(result).toBeNull();

    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");
    const result2 = resolvePath({ tree, path: "/dir/nonexistent/file" });
    expect(result2).toBeNull();
  });
});
