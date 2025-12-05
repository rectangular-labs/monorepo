import type {
  FsNodePayload,
  LoroDocMapping,
} from "@rectangular-labs/api-seo/types";
import {
  moveNode,
  removeNodeAtPath,
  resolvePath,
  writeToFile,
} from "@rectangular-labs/loro-file-system";
import { LoroDoc, LoroText, type LoroTreeNode } from "loro-crdt";
import { describe, expect, it } from "vitest";
import { buildTree } from "./build-tree";

// Test utilities
function createLoroDoc(): LoroDoc<LoroDocMapping> {
  const doc = new LoroDoc<LoroDocMapping>();
  const tree = doc.getTree("fs");
  const rootNode = tree.createNode();
  rootNode.data.set("type", "dir");
  rootNode.data.set("name", "__root__");
  return doc;
}

function getRootNode(
  doc: LoroDoc<LoroDocMapping>,
): LoroTreeNode<FsNodePayload> {
  const tree = doc.getTree("fs");
  const root = tree.roots()[0];
  if (!root) {
    throw new Error("Root node not found");
  }
  return root as LoroTreeNode<FsNodePayload>;
}

function createDirectory(
  parent: LoroTreeNode<FsNodePayload>,
  name: string,
): LoroTreeNode<FsNodePayload> {
  const node = parent.createNode();
  node.data.set("type", "dir");
  node.data.set("name", name);
  return node;
}

describe("buildTree: basic tree building", () => {
  it("should return empty array for empty tree", () => {
    const doc = createLoroDoc();
    const result = buildTree(doc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual([]);
    }
  });

  it("should build tree with no nesting (flat structure)", () => {
    const doc = createLoroDoc();
    const root = getRootNode(doc);

    const tree = doc.getTree("fs");
    writeToFile({
      tree,
      path: "/file1.txt",
      content: "content1",
      createIfMissing: true,
    });
    writeToFile({
      tree,
      path: "/file2.js",
      content: "content2",
      createIfMissing: true,
    });

    createDirectory(root, "dir1");

    const result = buildTree(doc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(3);
      expect(result.value).toEqual([
        {
          type: "file",
          name: "file1.txt",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          fileExtension: "txt",
          changes: undefined,
          content: expect.any(LoroText),
        },
        {
          type: "file",
          name: "file2.js",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          fileExtension: "js",
          changes: undefined,
          content: expect.any(LoroText),
        },
        {
          type: "dir",
          name: "dir1",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          children: [],
          changes: undefined,
        },
      ]);
      const firstFile = result.value[0];
      if (firstFile?.type === "file") {
        expect(firstFile?.content.toString()).toBe("content1");
      }
      const secondFile = result.value[1];
      if (secondFile?.type === "file") {
        expect(secondFile?.content.toString()).toBe("content2");
      }
    }
  });

  it("should build tree with 1 layer of nesting", () => {
    const doc = createLoroDoc();
    const tree = doc.getTree("fs");
    writeToFile({
      tree,
      path: "/dir1/file1.txt",
      content: "content1",
      createIfMissing: true,
    });
    writeToFile({
      tree,
      path: "/dir1/file2.js",
      content: "content2",
      createIfMissing: true,
    });

    const result = buildTree(doc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toEqual({
        type: "dir",
        name: "dir1",
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        children: [
          {
            type: "file",
            name: "file1.txt",
            fileExtension: "txt",
            content: expect.any(LoroText),
            changes: undefined,
            parentTreeId: expect.any(String),
            treeId: expect.any(String),
          },
          {
            type: "file",
            name: "file2.js",
            fileExtension: "js",
            content: expect.any(LoroText),
            changes: undefined,
            parentTreeId: expect.any(String),
            treeId: expect.any(String),
          },
        ],
        changes: undefined,
      });
    }
  });

  it("should build tree with arbitrary nesting levels", () => {
    const doc = createLoroDoc();
    const tree = doc.getTree("fs");

    // Create: /dir1/root-file.txt
    writeToFile({
      tree,
      path: "/dir1/root-file.txt",
      content: "root content",
      createIfMissing: true,
    });
    // Create: /dir1/dir2/level2-file.js
    writeToFile({
      tree,
      path: "/dir1/dir2/level2-file.js",
      content: "level2 content",
      createIfMissing: true,
    });
    // Create: /dir1/dir2/dir3/deep-file.md
    writeToFile({
      tree,
      path: "/dir1/dir2/dir3/deep-file.md",
      content: "deep content",
      createIfMissing: true,
    });
    // Create: /dir4/sibling-file.json
    writeToFile({
      tree,
      path: "/dir4/sibling-file.json",
      content: "{}",
      createIfMissing: true,
    });
    const result = buildTree(doc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);

      // Check dir1 structure
      expect(result.value[0]).toEqual({
        type: "dir",
        name: "dir1",
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        changes: undefined,
        children: [
          {
            type: "file",
            name: "root-file.txt",
            fileExtension: "txt",
            content: expect.any(LoroText),
            changes: undefined,
            parentTreeId: expect.any(String),
            treeId: expect.any(String),
          },
          {
            type: "dir",
            name: "dir2",
            parentTreeId: expect.any(String),
            treeId: expect.any(String),
            changes: undefined,
            children: [
              {
                type: "file",
                name: "level2-file.js",
                fileExtension: "js",
                content: expect.any(LoroText),
                changes: undefined,
                parentTreeId: expect.any(String),
                treeId: expect.any(String),
              },
              {
                type: "dir",
                name: "dir3",
                parentTreeId: expect.any(String),
                treeId: expect.any(String),
                changes: undefined,
                children: [
                  {
                    type: "file",
                    name: "deep-file.md",
                    fileExtension: "md",
                    content: expect.any(LoroText),
                    changes: undefined,
                    parentTreeId: expect.any(String),
                    treeId: expect.any(String),
                  },
                ],
              },
            ],
          },
        ],
      });
      // Check dir4 structure
      expect(result.value[1]).toEqual({
        type: "dir",
        name: "dir4",
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        changes: undefined,
        children: [
          {
            type: "file",
            name: "sibling-file.json",
            fileExtension: "json",
            content: expect.any(LoroText),
            changes: undefined,
            parentTreeId: expect.any(String),
            treeId: expect.any(String),
          },
        ],
      });
    }
  });
});

describe("buildTree: folder diff operations", () => {
  it("should detect folder name change", () => {
    const baseDoc = createLoroDoc();
    const baseRoot = getRootNode(baseDoc);
    createDirectory(baseRoot, "oldName");

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newRoot = getRootNode(newDoc);
    const dirToRename = newRoot.children()?.[0];
    if (!dirToRename) throw new Error("Directory not found");
    dirToRename.data.set("name", "newName");

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        type: "dir",
        name: "newName",
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        children: [],
        changes: {
          action: "update",
          name: "newName",
        },
      });
    }
  });

  it("should detect folder moved from one dir to another", () => {
    const baseDoc = createLoroDoc();
    const baseRoot = getRootNode(baseDoc);
    const sourceDir = createDirectory(baseRoot, "source");
    createDirectory(baseRoot, "target");
    createDirectory(sourceDir, "moveable");

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const tree = newDoc.getTree("fs");
    moveNode({
      tree,
      fromPath: "/source/moveable",
      toPath: "/target",
    });

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual([
        {
          type: "dir",
          name: "source",
          children: [],
          changes: undefined,
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
        },
        {
          type: "dir",
          name: "target",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          changes: undefined,
          children: [
            {
              type: "dir",
              name: "moveable",
              parentTreeId: expect.any(String),
              treeId: expect.any(String),
              children: [],
              changes: {
                action: "move",
              },
            },
          ],
        },
      ]);
    }
  });

  it("should detect folder moved and renamed", () => {
    const baseDoc = createLoroDoc();
    const baseRoot = getRootNode(baseDoc);
    const sourceDir = createDirectory(baseRoot, "source");
    createDirectory(baseRoot, "target");
    createDirectory(sourceDir, "oldName");

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const tree = newDoc.getTree("fs");
    moveNode({
      tree,
      fromPath: "/source/oldName",
      toPath: "/target",
    });

    const newRoot = getRootNode(newDoc);
    const newTargetDir = newRoot
      .children()
      ?.find((child) => child.data.get("name") === "target");
    const newMoveableDir = newTargetDir?.children()?.[0];
    if (!newMoveableDir) {
      throw new Error("Nodes not found");
    }
    newMoveableDir.data.set("name", "newName");

    const result = buildTree(newDoc, baseDoc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual([
        {
          type: "dir",
          name: "source",
          children: [],
          changes: undefined,
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
        },

        {
          type: "dir",
          name: "target",
          changes: undefined,
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          children: [
            {
              type: "dir",
              name: "newName",
              parentTreeId: expect.any(String),
              treeId: expect.any(String),
              children: [],
              changes: {
                action: "move",
                name: "newName",
              },
            },
          ],
        },
      ]);
    }
  });

  it("should detect deleted folder", () => {
    const baseDoc = createLoroDoc();
    const tree = baseDoc.getTree("fs");
    writeToFile({
      tree,
      path: "/something/toDelete/file.txt",
      content: "content",
      createIfMissing: true,
    });
    writeToFile({
      tree,
      path: "/test/file2.txt",
      content: "content2",
      createIfMissing: true,
    });

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    removeNodeAtPath({
      tree: newTree,
      path: "/something/toDelete",
      recursive: true,
    });
    removeNodeAtPath({
      tree: newTree,
      path: "/test",
      recursive: true,
    });

    const result = buildTree(newDoc, baseDoc);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual([
        {
          type: "dir",
          name: "something",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          changes: undefined,
          children: [
            {
              type: "dir",
              name: "toDelete",
              parentTreeId: expect.any(String),
              treeId: expect.any(String),
              changes: {
                action: "delete",
              },
              children: [
                {
                  type: "file",
                  name: "file.txt",
                  fileExtension: "txt",
                  content: expect.any(LoroText),
                  parentTreeId: expect.any(String),
                  treeId: expect.any(String),
                  changes: {
                    action: "delete",
                  },
                },
              ],
            },
          ],
        },
        {
          type: "dir",
          name: "test",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          changes: {
            action: "delete",
          },
          children: [
            {
              type: "file",
              name: "file2.txt",
              fileExtension: "txt",
              content: expect.any(LoroText),
              parentTreeId: expect.any(String),
              treeId: expect.any(String),
              changes: {
                action: "delete",
              },
            },
          ],
        },
      ]);
    }
  });

  it("should detect new empty folder", () => {
    const baseDoc = createLoroDoc();
    const baseRoot = getRootNode(baseDoc);
    createDirectory(baseRoot, "something");

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newRoot = getRootNode(newDoc);
    const newSomethingDir = newRoot.children()?.[0];
    if (!newSomethingDir) throw new Error("Directory not found");
    createDirectory(newSomethingDir, "newFolder");

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value).toMatchObject([
        {
          type: "dir",
          name: "something",
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          changes: undefined,
          children: [
            {
              type: "dir",
              name: "newFolder",
              parentTreeId: expect.any(String),
              treeId: expect.any(String),
              children: [],
              changes: {
                action: "create",
              },
            },
          ],
        },
      ]);
    }
  });
});

describe("buildTree: file diff operations", () => {
  it("should detect file name change", () => {
    const baseDoc = createLoroDoc();
    const baseTree = baseDoc.getTree("fs");
    writeToFile({
      tree: baseTree,
      path: "/oldName.txt",
      content: "content",
      createIfMissing: true,
    });

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    const fileToRename = resolvePath({
      tree: newTree,
      path: "/oldName.txt",
    });
    if (!fileToRename) throw new Error("File not found");
    fileToRename.data.set("name", "newName.txt");

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        type: "file",
        name: "newName.txt",
        fileExtension: "txt",
        content: expect.any(LoroText),
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        changes: {
          action: "update",
          name: "newName.txt",
          content: undefined,
        },
      });
    }
  });

  it("should detect file extension change", () => {
    const baseDoc = createLoroDoc();
    const baseTree = baseDoc.getTree("fs");
    writeToFile({
      tree: baseTree,
      path: "/file.txt",
      content: "content",
      createIfMissing: true,
    });

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newRoot = getRootNode(newDoc);
    const fileToEdit = newRoot.children()?.[0];
    if (!fileToEdit) throw new Error("File not found");
    fileToEdit.data.set("fileExtension", "md");

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        type: "file",
        name: "file.txt",
        fileExtension: "md",
        content: expect.any(LoroText),
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        changes: {
          action: "update",
          fileExtension: "md",
        },
      });
    }
  });

  it("should detect new empty file", () => {
    const baseDoc = createLoroDoc();

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    writeToFile({
      tree: newTree,
      path: "/newFile.txt",
      content: "",
      createIfMissing: true,
    });

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value[0]).toMatchObject({
        type: "file",
        name: "newFile.txt",
        fileExtension: "txt",
        content: expect.any(LoroText),
        parentTreeId: expect.any(String),
        treeId: expect.any(String),
        changes: {
          action: "create",
          name: "newFile.txt",
          fileExtension: "txt",
          content: undefined,
        },
      });
    }
  });

  it("should detect file content change", () => {
    const baseDoc = createLoroDoc();
    const baseTree = baseDoc.getTree("fs");
    writeToFile({
      tree: baseTree,
      path: "/file.txt",
      content: "original content is great",
      createIfMissing: true,
    });

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    const fileToEdit = resolvePath({
      tree: newTree,
      path: "/file.txt",
    });
    if (!fileToEdit) throw new Error("File not found");
    const content = fileToEdit.data.get("content") as LoroText;
    content.delete(7, 7);
    content.insert(
      content.length,
      ` app
cool stuff here.`,
    );

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value).toMatchObject([
        {
          type: "file",
          name: "file.txt",
          fileExtension: "txt",
          content: expect.any(LoroText),
          parentTreeId: expect.any(String),
          treeId: expect.any(String),
          changes: {
            action: "update",
            content: [
              {
                retain: 7,
              },
              {
                delete: 7,
              },
              {
                retain: 11,
              },
              {
                insert: ` app
cool stuff here.`,
              },
            ],
          },
        },
      ]);
      const file = result.value[0];
      if (file?.type === "file") {
        expect(file?.content.toString()).toBe("original content is great");
      }
    }
  });

  it("should detect file moved from one folder to another", () => {
    const baseDoc = createLoroDoc();
    const baseTree = baseDoc.getTree("fs");
    writeToFile({
      tree: baseTree,
      path: "/source/moveable.txt",
      content: "content",
      createIfMissing: true,
    });
    const baseRootNode = getRootNode(baseDoc);
    createDirectory(baseRootNode, "target");

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    moveNode({
      tree: newTree,
      fromPath: "/source/moveable.txt",
      toPath: "/target",
    });

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(2);
      expect(result.value).toEqual([
        {
          type: "dir",
          name: "source",
          treeId: expect.any(String),
          parentTreeId: expect.any(String),
          changes: undefined,
          children: [],
        },
        {
          type: "dir",
          name: "target",
          treeId: expect.any(String),
          parentTreeId: expect.any(String),
          changes: undefined,
          children: [
            {
              type: "file",
              name: "moveable.txt",
              fileExtension: "txt",
              content: expect.any(LoroText),
              treeId: expect.any(String),
              parentTreeId: expect.any(String),
              changes: {
                action: "move",
              },
            },
          ],
        },
      ]);
    }
  });

  it("should detect deleted file", () => {
    const baseDoc = createLoroDoc();
    const baseTree = baseDoc.getTree("fs");
    writeToFile({
      tree: baseTree,
      path: "/toDelete/file.txt",
      content: "content",
      createIfMissing: true,
    });

    const newDoc = baseDoc.fork() as LoroDoc<LoroDocMapping>;
    const newTree = newDoc.getTree("fs");
    const fileToDelete = resolvePath({
      tree: newTree,
      path: "/toDelete/file.txt",
    });
    if (!fileToDelete) throw new Error("File not found");
    newTree.delete(fileToDelete.id);

    const result = buildTree(newDoc, baseDoc);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toHaveLength(1);
      expect(result.value).toEqual([
        {
          type: "dir",
          name: "toDelete",
          treeId: expect.any(String),
          parentTreeId: expect.any(String),
          changes: undefined,
          children: [
            {
              type: "file",
              name: "file.txt",
              fileExtension: "txt",
              content: expect.any(LoroText),
              treeId: expect.any(String),
              parentTreeId: expect.any(String),
              changes: { action: "delete" },
            },
          ],
        },
      ]);
      const dir = result.value[0];
      if (dir?.type === "dir") {
        expect(dir?.children).toHaveLength(1);
        const file = dir?.children?.[0];
        if (file?.type === "file") {
          expect(file?.content.toString()).toBe("content");
        }
      }
    }
  });
});
