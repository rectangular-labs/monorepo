import { LoroText, LoroTree } from "loro-crdt";
import { describe, expect, it } from "vitest";
import {
  type BaseFileSystem,
  catOutput,
  defaultNodeFormatter,
  lsOutput,
  moveNode,
  removeNodeAtPath,
  writeToFile,
} from "./index";
import { resolvePath } from "./utils/resolve-path";

type TestFileSystem = BaseFileSystem & {
  content?: LoroText;
};

describe("defaultNodeFormatter", () => {
  it("should format a directory node with file children", () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");

    const result = defaultNodeFormatter(rootNode, "/");
    expect(result).toEqual(`/:
  - test.txt (file)`);
  });

  it("should format a directory with directory children", () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const file1 = dirNode.createNode();
    file1.data.set("name", "file1.txt");
    file1.data.set("type", "file");

    const file2 = dirNode.createNode();
    file2.data.set("name", "file2.txt");
    file2.data.set("type", "file");

    const file3 = dirNode.createNode();
    file3.data.set("name", "file3.js");
    file3.data.set("type", "file");

    const result = defaultNodeFormatter(rootNode, "/");
    expect(result).toEqual(`/:
  - subdir/ [3 files in subtree: 2 *.txt, 1 *.js]`);
  });

  it("should format a file node", () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");

    const result = defaultNodeFormatter(fileNode, "/test.txt");
    expect(result).toBe("/test.txt (file)");
  });
});

describe("lsOutput", () => {
  it("should list nodes at root path", () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");

    const result = lsOutput({
      tree,
      path: "/",
      formatNode: defaultNodeFormatter,
    });
    expect(result).toEqual({
      success: true,
      data: `/:
  - test.txt (file)`,
    });
  });

  it("should return error message for non-existent path", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const result = lsOutput({
      tree,
      path: "/nonexistent",
      formatNode: defaultNodeFormatter,
    });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent not found",
    });
  });

  it("should use custom formatter", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const customFormatter = () => "custom output";

    const result = lsOutput({
      tree,
      path: "/",
      formatNode: customFormatter,
    });
    expect(result).toEqual({ success: true, data: "custom output" });
  });
});

describe("catOutput", () => {
  it("should read file content", () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");
    const content = new LoroText();
    const textContent = "Hello, World!";
    content.insert(0, textContent);
    fileNode.data.setContainer("content", content);

    const result = catOutput({
      tree: tree,
      path: "/test.txt",
      readContent: (node) => {
        const textContainer = node.data.get("content");
        if (!textContainer) {
          throw new Error("Content not found");
        }
        return textContainer.toString();
      },
    });
    expect(result).toEqual({ success: true, data: textContent });
  });

  it("should return error for non-existent path", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const result = catOutput({
      tree,
      path: "/nonexistent.txt",
      readContent: () => "",
    });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent.txt not found",
    });
  });

  it("should return error when path is a directory", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const result = catOutput({
      tree,
      path: "/subdir",
      readContent: () => "",
    });
    expect(result).toEqual({
      success: false,
      message: "Cannot read contents from /subdir because it is not a file",
    });
  });
});

describe("removeNodeAtPath", () => {
  it("should remove a file node", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");

    const result = removeNodeAtPath({ tree, path: "/test.txt" });
    expect(result).toEqual({ success: true });
    expect(rootNode.children()?.length).toBe(0);
  });

  it("should remove an empty directory", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const result = removeNodeAtPath({
      tree,
      path: "/subdir",
      recursive: false,
    });
    expect(result).toEqual({ success: true });
    expect(rootNode.children()?.length).toBe(0);
  });

  it("should not remove a non-empty directory without recursive flag", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const fileNode = dirNode.createNode();
    fileNode.data.set("name", "file.txt");
    fileNode.data.set("type", "file");

    const result = removeNodeAtPath({
      tree,
      path: "/subdir",
      recursive: false,
    });
    expect(result).toEqual({
      success: false,
      message:
        "Directory /subdir is not empty. Set recursive=true to remove it and all of its children",
    });
  });

  it("should remove a non-empty directory with recursive flag", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const fileNode = dirNode.createNode();
    fileNode.data.set("name", "file.txt");
    fileNode.data.set("type", "file");

    const result = removeNodeAtPath({ tree, path: "/subdir", recursive: true });
    expect(result).toEqual({ success: true });
    expect(rootNode.children()?.length).toBe(0);
  });

  it("should return error for non-existent path", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const result = removeNodeAtPath({ tree, path: "/nonexistent" });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent not found",
    });
  });
});

describe("moveNode", () => {
  it("should move a file node to a directory", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "target");
    dirNode.data.set("type", "dir");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "source.txt");
    fileNode.data.set("type", "file");

    const result = moveNode({
      tree,
      fromPath: "/source.txt",
      toPath: "/target",
    });
    expect(result).toEqual({ success: true });

    expect(rootNode.children()?.length).toBe(1);
    expect(dirNode.children()?.length).toBe(1);
    expect(dirNode.children()?.[0]?.data.get("name")).toBe("source.txt");
    expect(dirNode.children()?.[0]?.data.get("type")).toBe("file");
  });

  it("should move a directory node to another directory", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const targetDir = rootNode.createNode();
    targetDir.data.set("name", "target");
    targetDir.data.set("type", "dir");

    const sourceDir = rootNode.createNode();
    sourceDir.data.set("name", "source");
    sourceDir.data.set("type", "dir");

    const result = moveNode({ tree, fromPath: "/source", toPath: "/target" });
    expect(result).toEqual({ success: true });

    expect(rootNode.children()?.length).toBe(1);
    expect(sourceDir.children()).toBeUndefined();
    expect(targetDir.children()?.length).toBe(1);
    expect(targetDir.children()?.[0]?.data.get("name")).toBe("source");
    expect(targetDir.children()?.[0]?.data.get("type")).toBe("dir");
  });

  it("should return error when fromPath does not exist", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const targetDir = rootNode.createNode();
    targetDir.data.set("name", "target");
    targetDir.data.set("type", "dir");

    const result = moveNode({
      tree,
      fromPath: "/nonexistent-source",
      toPath: "/target",
    });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent-source not found",
    });
  });

  it("should return error when toPath does not exist", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "source.txt");
    fileNode.data.set("type", "file");

    const result = moveNode({
      tree,
      fromPath: "/source.txt",
      toPath: "/nonexistent-target",
    });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent-target not found",
    });
  });

  it("should return error when toPath is not a directory", () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const sourceFile = rootNode.createNode();
    sourceFile.data.set("name", "source.txt");
    sourceFile.data.set("type", "file");

    const targetFile = rootNode.createNode();
    targetFile.data.set("name", "target.txt");
    targetFile.data.set("type", "file");

    const result = moveNode({
      tree,
      fromPath: "/source.txt",
      toPath: "/target.txt",
    });
    expect(result).toEqual({
      success: false,
      message:
        "Cannot move /source.txt to /target.txt because /target.txt is not a directory",
    });
  });
});

describe("writeToFile", () => {
  it("should write content to an existing file", async () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");
    fileNode.data.setContainer("content", new LoroText());

    const result = await writeToFile({
      tree,
      path: "/test.txt",
      content: "Hello, World!",
    });
    expect(result).toEqual({ success: true });
    const textContainer = fileNode.data.get("content");
    expect(textContainer?.toString()).toBe("Hello, World!");

    const result2 = await writeToFile({
      tree,
      path: "/test.txt",
      content: "Hello, World!",
      contentMapKey: "content",
    });
    expect(result2).toEqual({ success: true });
    const textContainer2 = fileNode.data.get("content");
    expect(textContainer2?.toString()).toBe("Hello, World!");
  });

  it("should create file and intermediate directories if createIfMissing is true", async () => {
    const tree = new LoroTree<TestFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const result = await writeToFile({
      tree,
      path: "/newfile.txt",
      content: "New content",
      createIfMissing: true,
    });
    expect(result).toEqual({ success: true });

    expect(rootNode.children()?.length).toBe(1);
    expect(rootNode.children()?.[0]?.data.get("name")).toBe("newfile.txt");
    expect(rootNode.children()?.[0]?.data.get("type")).toBe("file");
    expect(rootNode.children()?.[0]?.data.get("content")?.toString()).toBe(
      "New content",
    );

    const resultWithDirectories = await writeToFile({
      tree,
      path: "/dir1/dir2/newfile.txt",
      content: "New content",
      createIfMissing: true,
    });
    expect(resultWithDirectories).toEqual({ success: true });

    const dir1 = rootNode
      .children()
      ?.find((child) => child.data.get("name") === "dir1");
    expect(dir1).toBeDefined();
    if (!dir1) throw new Error("Missing dir1");
    expect(dir1.children()?.length).toBe(1);
    expect(dir1.children()?.[0]?.data.get("name")).toBe("dir2");
    expect(dir1.children()?.[0]?.data.get("type")).toBe("dir");
    expect(dir1.children()?.[0]?.children()?.length).toBe(1);
    expect(dir1.children()?.[0]?.children()?.[0]?.data.get("name")).toBe(
      "newfile.txt",
    );
    expect(dir1.children()?.[0]?.children()?.[0]?.data.get("type")).toBe(
      "file",
    );
    expect(
      dir1.children()?.[0]?.children()?.[0]?.data.get("content")?.toString(),
    ).toBe("New content");
  });

  it("should return error when path does not exist and createIfMissing is false", async () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const result = await writeToFile({
      tree,
      path: "/nonexistent.txt",
      content: "Content",
      createIfMissing: false,
    });
    expect(result).toEqual({
      success: false,
      message: "Path /nonexistent.txt not found",
    });
  });

  it("should return error when path is a directory", async () => {
    const tree = new LoroTree<BaseFileSystem>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const dirNode = rootNode.createNode();
    dirNode.data.set("name", "subdir");
    dirNode.data.set("type", "dir");

    const result = await writeToFile({
      tree,
      path: "/subdir",
      content: "Content",
    });
    expect(result).toEqual({
      success: false,
      message: "Cannot write to /subdir because it is not a file",
    });
  });

  it("should use custom contentMapKey", async () => {
    const tree = new LoroTree<TestFileSystem & { customContent: LoroText }>();
    const rootNode = resolvePath({ tree, path: "/" });
    if (!rootNode) throw new Error("Missing rootNode");

    const fileNode = rootNode.createNode();
    fileNode.data.set("name", "test.txt");
    fileNode.data.set("type", "file");
    const content = new LoroText();
    fileNode.data.setContainer("customContent", content);

    const result = await writeToFile({
      tree: tree,
      path: "/test.txt",
      content: "Custom content",
      contentMapKey: "customContent",
    });
    expect(result).toEqual({ success: true });
    const textContainer = fileNode.data.get("customContent");
    expect(textContainer.toString()).toBe("Custom content");
  });
});
