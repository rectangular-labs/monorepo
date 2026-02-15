import {
  articleTypeSchema,
  contentStatusSchema,
} from "@rectangular-labs/core/schemas/content-parsers";
import type { DB } from "@rectangular-labs/db";
import { tool } from "ai";
import { type } from "arktype";
import {
  deleteDraftForSlug,
  getContentForSlug,
  listContentTree,
  normalizeContentSlug,
  sliceContentLines,
} from "../../content";
import {
  type WriteContentDraftArgs,
  writeContentDraft,
} from "../../content/write-content-draft";
import type { AgentToolDefinition } from "./utils";

const lsInputSchema = type({
  slug: type("string").describe(
    "The slug of the directory to list (e.g. '/').",
  ),
});

const catInputSchema = type({
  slug: type("string").describe("The slug of the file to read."),
  "startLine?": type("number|null").describe(
    "The line number to start at. If not provided, startLine will default to 1.",
  ),
  "endLine?": type("number|null").describe(
    "The line number to end at. If not provided, endLine will default to the last line of the file.",
  ),
});

const rmInputSchema = type({
  slug: type("string").describe("The slug of the file to delete."),
});

const _mvInputSchema = type({
  fromSlug: type("string").describe("The slug of the file/directory to move."),
  toSlug: type("string").describe("The destination slug."),
});

const writeFileInputSchema = type({
  "id?": type("string|null").describe("The ID of the draft to update."),
  "slug?": type("string|null").describe(
    "The slug of the file to update (required when creating a new file).",
  ),
  "primaryKeyword?": type("string").describe(
    "The primary keyword for the file (required when creating a new file).",
  ),
  "contentMarkdown?": type("string|null").describe(
    "The Markdown content for the file.",
  ),
  "title?": type("string|null").describe("The title of the file."),
  "description?": type("string|null").describe(
    "The meta description for the file.",
  ),
  "notes?": type("string|null").describe("Internal notes about the file."),
  "outline?": type("string|null").describe("The outline for the file."),
  "articleType?": articleTypeSchema
    .or(type.null)
    .describe("The article type (if setting)."),
  "status?": contentStatusSchema
    .or(type.null)
    .describe("The draft status (e.g. 'writing', 'pending-review', etc.)."),
});

export function createFileToolsWithMetadata(args: {
  db: DB;
  organizationId: string;
  projectId: string;
  userId: string | undefined;
  chatId: string | null;
}) {
  const ls = tool({
    description:
      "List files and directories in the virtual workspace filesystem, similar to `ls`.",
    inputSchema: lsInputSchema,
    async execute({ slug }) {
      return await listContentTree({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        originatingChatId: args.chatId,
        slug,
      });
    },
  });

  const cat = tool({
    description:
      "Read the contents of a file in the virtual workspace filesystem, similar to `cat` (supports line ranges).",
    inputSchema: catInputSchema,
    async execute({ slug, startLine, endLine }) {
      const result = await getContentForSlug({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        slug: normalizeContentSlug(slug),
        withContent: true,
      });
      if (!result.ok) {
        return {
          success: false,
          message: result.error.message,
        };
      }

      const content = result.value.data.content.contentMarkdown ?? "";
      const sliced = sliceContentLines({
        content,
        startLine: startLine ?? undefined,
        endLine: endLine ?? undefined,
      });
      if (!sliced.ok) {
        return { success: false, message: sliced.error.message };
      }
      return { success: true, data: sliced.value.text };
    },
  });

  const rm = tool({
    description:
      "Delete a file in the virtual workspace filesystem, similar to `rm`.",
    inputSchema: rmInputSchema,
    async execute({ slug }) {
      const result = await deleteDraftForSlug({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        slug: normalizeContentSlug(slug),
      });
      if (!result.ok) {
        return { success: false, message: result.error.message };
      }
      return { success: true, message: "File or directory deleted." };
    },
  });

  // const mv = tool({
  //   description:
  //     "Move or rename a file or directory in the virtual workspace filesystem, similar to `mv`.",
  //   inputSchema: mvInputSchema,
  //   async execute({ fromSlug, toSlug }) {
  //     const from = normalizeContentSlug(fromSlug);
  //     const to = normalizeContentSlug(toSlug);
  //     if (!from || !to) {
  //       return { success: false, message: "Invalid slugs." };
  //     }
  //     return await moveDraftSlug({
  //       db: args.db,
  //       organizationId: args.organizationId,
  //       projectId: args.projectId,
  //       fromSlug: from,
  //       toSlug: to,
  //       originatingChatId: args.chatId ?? null,
  //       userId: args.userId ?? null,
  //     });
  //   },
  // });

  const writeFile = tool({
    description:
      "Create or update a file in the virtual workspace filesystem by slug (content, title, description, notes, outline, etc.).",
    inputSchema: writeFileInputSchema,
    async execute({
      id,
      slug,
      contentMarkdown,
      primaryKeyword,
      title,
      description,
      notes,
      outline,
      articleType,
      status,
    }) {
      if (!id && !slug && !primaryKeyword) {
        return {
          success: false,
          message:
            "slug or primaryKeyword is required to create a new file. If trying to update an existing file, provide the file ID.",
        };
      }
      const lookup = id
        ? { type: "id" as const, id }
        : {
            type: "slug" as const,
            slug: slug ?? "",
            primaryKeyword: primaryKeyword ?? undefined,
          };

      const result = await writeContentDraft({
        db: args.db,
        chatId: args.chatId ?? null,
        userId: args.userId ?? null,
        projectId: args.projectId,
        organizationId: args.organizationId,
        // cast to keep ts happy
        lookup: lookup as Extract<
          WriteContentDraftArgs["lookup"],
          { type: "slug" }
        >,
        draftNewValues: {
          slug: slug ?? undefined,
          ...(primaryKeyword != null ? { primaryKeyword } : {}),
          ...(contentMarkdown != null ? { contentMarkdown } : {}),
          ...(title != null ? { title } : {}),
          ...(description != null ? { description } : {}),
          ...(notes != null ? { notes } : {}),
          ...(outline != null ? { outline } : {}),
          ...(articleType != null ? { articleType } : {}),
          ...(status != null ? { status } : {}),
        },
      });
      if (!result.ok) {
        return { success: false, message: result.error.message };
      }
      return {
        success: true,
        message: "File updated.",
        draft: result.value.draft,
      };
    },
  });

  const tools = {
    ls,
    cat,
    rm,
    // mv,
    write_file: writeFile,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "ls",
      toolDescription: "List files/directories in the chat workspace.",
      toolInstruction:
        "Provide a slug prefix to list (e.g. '/' or '/finance/guides'). Use to discover existing content before editing.",
      tool: ls,
    },
    {
      toolName: "cat",
      toolDescription: "Read a file from the chat workspace.",
      toolInstruction:
        "Provide a file slug (e.g. '/finance/guides/how-to-budget') plus optional startLine/endLine. Use to fetch existing content before proposing changes.",
      tool: cat,
    },
    {
      toolName: "rm",
      toolDescription: "Delete a file or directory in the chat workspace.",
      toolInstruction:
        "Provide a slug. Prefer to ask before destructive deletes unless the user explicitly requested.",
      tool: rm,
    },
    // {
    //   toolName: "mv",
    //   toolDescription: "Move/rename a file or directory in the chat workspace.",
    //   toolInstruction:
    //     "Provide fromSlug and toSlug. Use to reorganize content or rename files.",
    //   tool: mv,
    // },
    {
      toolName: "write_file",
      toolDescription:
        "Create or overwrite various parts of a file in the chat workspace.",
      toolInstruction:
        "Provide id to update an existing file or slug + primaryKeyword to create a new file. Provide the fields to set (contentMarkdown/title/description/notes/outline/slug/primaryKeyword/articleType/status/etc.).",
      tool: writeFile,
    },
  ];

  return { toolDefinitions, tools };
}
