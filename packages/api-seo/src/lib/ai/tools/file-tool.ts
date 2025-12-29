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
import { withLoroTree } from "../../workspace/with-loro-tree";
import type { AgentToolDefinition } from "./utils";

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
  "metadata?": type({
    key: "string",
    value: "string",
  }).array(),
});

export function createFileToolsWithMetadata() {
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
            readContent: (node) => node.data.get("content")?.toString() ?? "",
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
    async execute({ path, content, createIfMissing, metadata }) {
      return await withLoroTree({
        handler: ({ tree }) =>
          writeToFile({ tree, path, content, createIfMissing, metadata }),
        shouldPersist: (result) => result.success === true,
      });
    },
  });

  const tools = {
    ls,
    cat,
    rm,
    mv,
    write_file: writeFile,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "ls",
      toolDescription: "List files/directories in the campaign workspace.",
      toolInstruction:
        "Provide an absolute workspace path (e.g. '/'). Use to discover existing content before editing.",
      tool: ls,
    },
    {
      toolName: "cat",
      toolDescription: "Read a file from the campaign workspace.",
      toolInstruction:
        "Provide an absolute workspace path. Use to fetch existing content before proposing changes.",
      tool: cat,
    },
    {
      toolName: "rm",
      toolDescription: "Delete a file or directory in the campaign workspace.",
      toolInstruction:
        "Provide absolute path. Use recursive=true for directories. Prefer to ask before destructive deletes unless user explicitly requested.",
      tool: rm,
    },
    {
      toolName: "mv",
      toolDescription:
        "Move/rename a file or directory in the campaign workspace.",
      toolInstruction:
        "Provide fromPath and toPath as absolute workspace paths. Use to reorganize content or rename files.",
      tool: mv,
    },
    {
      toolName: "write_file",
      toolDescription: "Create or overwrite a file in the campaign workspace.",
      toolInstruction:
        "Provide absolute path + full content. Set createIfMissing=true when creating new files. Prefer small, isolated edits unless user asked for rewrites.",
      tool: writeFile,
    },
  ];

  return { toolDefinitions, tools };
}

export function createFileTools(): ReturnType<
  typeof createFileToolsWithMetadata
>["tools"] {
  return createFileToolsWithMetadata().tools;
}
