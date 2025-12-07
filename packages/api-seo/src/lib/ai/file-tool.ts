import {
  catOutput,
  defaultNodeFormatter,
  lsOutput,
  moveNode,
  removeNodeAtPath,
  writeToFile,
} from "@rectangular-labs/loro-file-system";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { LoroDoc } from "loro-crdt";
import { CrdtType } from "loro-protocol";
import type { LoroDocMapping } from "../../types";
import {
  getOrCreateRoomDocument,
  WORKSPACE_CONTENT_ROOM_ID,
} from "../workspace";

async function withLoroTree<TResult>({
  handler,
  shouldPersist,
}: {
  handler: (args: { tree: LoroDocMapping["fs"] }) => TResult | Promise<TResult>;
  shouldPersist: boolean | ((result: TResult) => boolean);
}): Promise<TResult> {
  const roomResult = await getOrCreateRoomDocument(
    WORKSPACE_CONTENT_ROOM_ID,
    CrdtType.Loro,
  );
  if (!roomResult.ok) {
    throw roomResult.error;
  }
  const roomDoc = roomResult.value;
  const loroDoc = loadDocFromRoom(roomDoc.data);
  const tree = getFsRoot(loroDoc);

  const result = await handler({ tree });

  const persist =
    typeof shouldPersist === "boolean" ? shouldPersist : shouldPersist(result);

  if (persist) {
    roomDoc.data = loroDoc.export({ mode: "snapshot" });
    roomDoc.dirty = true;
  }

  return result;
}

function loadDocFromRoom(data: Uint8Array): LoroDoc<LoroDocMapping> {
  const doc = new LoroDoc<LoroDocMapping>();
  if (data.byteLength > 0) {
    doc.import(data);
  }
  return doc;
}

function getFsRoot(doc: LoroDoc<LoroDocMapping>) {
  const tree = doc.getTree("fs");
  return tree;
}

const lsInputSchema = type({
  path: "string",
});

const catInputSchema = type({
  path: "string",
});

const rmInputSchema = type({
  path: "string",
  recursive: "boolean",
});

const mvInputSchema = type({
  fromPath: "string",
  toPath: "string",
});

const writeFileInputSchema = type({
  path: "string",
  content: "string",
  "createIfMissing?": "boolean",
});

const _applyEditsInputSchema = type({
  path: "string",
  "createIfMissing?": "boolean",
  edits: [
    {
      type: "'insert'",
      index: "number",
      text: "string",
    },
    {
      type: "'delete'",
      start: "number",
      end: "number",
    },
    {
      type: "'replace'",
      start: "number",
      end: "number",
      text: "string",
    },
  ],
});

export function createFileTools() {
  const ls = tool({
    description:
      "List files and directories in the virtual workspace filesystem, similar to `ls`.",
    inputSchema: jsonSchema<typeof lsInputSchema.infer>(
      lsInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ path }) {
      return await withLoroTree({
        handler: ({ tree }) =>
          lsOutput({ tree, path, formatNode: defaultNodeFormatter }),
        shouldPersist: false,
      });
    },
  });

  const cat = tool({
    description:
      "Read the full contents of a file in the virtual workspace filesystem, similar to `cat`.",
    inputSchema: jsonSchema<typeof catInputSchema.infer>(
      catInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ path }) {
      return await withLoroTree({
        handler: ({ tree }) =>
          catOutput({
            tree,
            path,
            readContent: (node) => {
              return node.data.get("content")?.toString() ?? "";
            },
          }),
        shouldPersist: false,
      });
    },
  });

  const rm = tool({
    description:
      "Delete a file or directory in the virtual workspace filesystem, similar to `rm` (use recursive=true for directories).",
    inputSchema: jsonSchema<typeof rmInputSchema.infer>(
      rmInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ path, recursive }) {
      return await withLoroTree({
        handler: ({ tree }) => removeNodeAtPath({ tree, path, recursive }),
        shouldPersist: (result) => result.success === true,
      });
    },
  });

  const mv = tool({
    description:
      "Move or rename a file or directory in the virtual workspace filesystem, similar to `mv`.",
    inputSchema: jsonSchema<typeof mvInputSchema.infer>(
      mvInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ fromPath, toPath }) {
      return await withLoroTree({
        handler: ({ tree }) => moveNode({ tree, fromPath, toPath }),
        shouldPersist: (result) => result.success === true,
      });
    },
  });

  const writeFile = tool({
    description:
      "Create or overwrite a file in the virtual workspace filesystem with the given content, similar to shell redirection with `>`.",
    inputSchema: jsonSchema<typeof writeFileInputSchema.infer>(
      writeFileInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ path, content, createIfMissing }) {
      return await withLoroTree({
        handler: ({ tree }) =>
          writeToFile({ tree, path, content, createIfMissing }),
        shouldPersist: (result) => result.success === true,
      });
    },
  });

  // const applyEdits = tool({
  //   description:
  //     "Apply text edits to a file in the virtual workspace filesystem. Supports insert, delete, and replace operations.",
  //   inputSchema: jsonSchema<typeof applyEditsInputSchema.infer>(
  //     applyEditsInputSchema.toJsonSchema() as JSONSchema7,
  //   ),
  //   async execute({ path, createIfMissing, edits }) {
  //     const roomResult = await getOrCreateRoomDocument(
  //       WORKSPACE_CONTENT_ROOM_ID,
  //       CrdtType.Loro,
  //     );
  //     if (!roomResult.ok) {
  //       throw roomResult.error;
  //     }
  //     const roomDoc = roomResult.value;
  //     const loroDoc = loadDocFromRoom(roomDoc.data);
  //     const tree = getFsRoot(loroDoc);

  //     const normalized = normalizePath(path);

  //     let filePayload: Extract<FsNodePayload, { type: "file" }>;
  //     try {
  //       const { payload } = resolvePath(tree, normalized);
  //       if (payload.type !== "file") {
  //         throw new Error(`Path is not a file: ${normalized}`);
  //       }
  //       filePayload = payload;
  //     } catch (error) {
  //       if (!createIfMissing) {
  //         throw error;
  //       }
  //       const created = getOrCreateFileNode({
  //         tree,
  //         doc: loroDoc,
  //         path: normalized,
  //         createParents: true,
  //       });
  //       filePayload = created.payload;
  //     }

  //     const text = getFileText(loroDoc, filePayload);

  //     // Apply edits from last to first to keep indices stable
  //     const sortedEdits = [...edits].sort((a, b) => {
  //       const aIndex = "index" in a ? a.index : "start" in a ? a.start : 0;
  //       const bIndex = "index" in b ? b.index : "start" in b ? b.start : 0;
  //       return bIndex - aIndex;
  //     });

  //     for (const edit of sortedEdits) {
  //       if (edit.type === "insert") {
  //         const index = Math.max(0, Math.min(edit.index, text.length));
  //         text.insert(index, edit.text);
  //       } else if (edit.type === "delete") {
  //         const start = Math.max(0, Math.min(edit.start, text.length));
  //         const end = Math.max(start, Math.min(edit.end, text.length));
  //         if (end > start) {
  //           text.delete(start, end - start);
  //         }
  //       } else if (edit.type === "replace") {
  //         const start = Math.max(0, Math.min(edit.start, text.length));
  //         const end = Math.max(start, Math.min(edit.end, text.length));
  //         if (end > start) {
  //           text.delete(start, end - start);
  //         }
  //         text.insert(start, edit.text);
  //       }
  //     }

  //     roomDoc.data = exportDocToRoom(loroDoc);
  //     roomDoc.dirty = true;
  //     roomDoc.lastSaved = Date.now();

  //     return {
  //       path: normalized,
  //       content: text.toString(),
  //     };
  //   },
  // });

  return {
    ls,
    cat,
    rm,
    mv,
    write_file: writeFile,
    // apply_edits: applyEdits,
  } as const;
}
