import { LoroTree } from "loro-crdt";
import { describe, expect, it } from "vitest";
import type { BaseFileSystem } from "../index";
import { traverseNode } from "./traverse-node";

describe("traverseNode", () => {
  it("should traverse node in pre-order (also by default if unspecified)", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "root");
    rootNode.data.set("type", "dir");

    const child1 = rootNode.createNode();
    child1.data.set("name", "child1");
    child1.data.set("type", "file");

    const child2 = rootNode.createNode();
    child2.data.set("name", "child2");
    child2.data.set("type", "file");

    const visitedUnspecified: string[] = [];
    const visitedPre: string[] = [];
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        visitedUnspecified.push(name);
      },
    });
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        visitedPre.push(name);
      },
      order: "pre",
    });

    expect(visitedPre).toEqual(["root", "child1", "child2"]);
    expect(visitedUnspecified).toEqual(["root", "child1", "child2"]);
    expect(visitedUnspecified).toEqual(visitedPre);
  });

  it("should traverse node in post-order", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "root");
    rootNode.data.set("type", "dir");

    const child1 = rootNode.createNode();
    child1.data.set("name", "child1");
    child1.data.set("type", "file");

    const child2 = rootNode.createNode();
    child2.data.set("name", "child2");
    child2.data.set("type", "file");

    const visited: string[] = [];
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        if (typeof name === "string") {
          visited.push(name);
        }
      },
      order: "post",
    });

    expect(visited).toEqual(["child1", "child2", "root"]);
  });

  it("should traverse deeply nested nodes", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "root");
    rootNode.data.set("type", "dir");

    const dir1 = rootNode.createNode();
    dir1.data.set("name", "dir1");
    dir1.data.set("type", "dir");

    const file1 = dir1.createNode();
    file1.data.set("name", "file1");
    file1.data.set("type", "file");

    const file2 = dir1.createNode();
    file2.data.set("name", "file2");
    file2.data.set("type", "file");

    const dir2 = rootNode.createNode();
    dir2.data.set("name", "dir2");
    dir2.data.set("type", "dir");

    const file3 = dir2.createNode();
    file3.data.set("name", "file3");
    file3.data.set("type", "file");

    const file4 = dir2.createNode();
    file4.data.set("name", "file4");
    file4.data.set("type", "file");

    const visitedPre: string[] = [];
    const visitedPost: string[] = [];
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        if (typeof name === "string") {
          visitedPre.push(name);
        }
      },
      order: "pre",
    });
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        if (typeof name === "string") {
          visitedPost.push(name);
        }
      },
      order: "post",
    });

    expect(visitedPre).toEqual([
      "root",
      "dir1",
      "file1",
      "file2",
      "dir2",
      "file3",
      "file4",
    ]);
    expect(visitedPost).toEqual([
      "file1",
      "file2",
      "dir1",
      "file3",
      "file4",
      "dir2",
      "root",
    ]);
  });

  it("should handle node with no children", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = tree.createNode();
    rootNode.data.set("name", "__root__");
    rootNode.data.set("type", "dir");

    const visited: string[] = [];
    traverseNode({
      node: rootNode,
      callback: (node) => {
        const name = node.data.get("name");
        if (typeof name === "string") {
          visited.push(name);
        }
      },
    });

    expect(visited).toEqual(["__root__"]);
  });
});
