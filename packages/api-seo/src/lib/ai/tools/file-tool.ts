import { ARTICLE_TYPES } from "@rectangular-labs/core/schemas/content-parsers";
import type { publishingSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import type { DB } from "@rectangular-labs/db";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import {
  deleteDraftForSlug,
  getContentForSlug,
  listContentTree,
  normalizeContentSlug,
  sliceContentLines,
} from "../../content";
import { writeContentDraft } from "../../content/write-content-draft";
import type { AgentToolDefinition } from "./utils";

const allowedDraftStatuses = [
  "suggested",
  "suggestion-rejected",
  "queued",
  "planning",
  "writing",
  "reviewing-writing",
  "pending-review",
  "scheduled",
  "published",
  "review-denied",
  "deleted",
] as const;
type DraftStatus = (typeof allowedDraftStatuses)[number];

function parseDraftStatus(
  value: string | null | undefined,
): DraftStatus | undefined {
  if (!value) return undefined;
  return allowedDraftStatuses.includes(value as DraftStatus)
    ? (value as DraftStatus)
    : undefined;
}

type ArticleType = (typeof ARTICLE_TYPES)[number];
function parseArticleType(
  value: string | null | undefined,
): ArticleType | undefined {
  if (!value) return undefined;
  return (ARTICLE_TYPES as readonly string[]).includes(value)
    ? (value as ArticleType)
    : undefined;
}

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
  slug: type("string").describe("The slug of the file to write."),
  "primaryKeyword?": type("string").describe(
    "The primary keyword for the file (required when creating a new file).",
  ),
  "createIfMissing?": "boolean",
  "content?": type("string|null").describe(
    "Deprecated alias for contentMarkdown.",
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
  "articleType?": type("string|null").describe(
    "The article type (if setting).",
  ),
  "status?": type("string|null").describe(
    "The draft status (e.g. 'writing', 'pending-review', etc.).",
  ),
});

export function createFileToolsWithMetadata(args: {
  publishingSettings: typeof publishingSettingsSchema.infer | null;
  // TODO: pass userId through to draft writes when available.
  userId: string | undefined;
  db: DB;
  organizationId: string;
  projectId: string;
  chatId: string | null;
}) {
  const publishingSettings = args.publishingSettings || null;
  const ls = tool({
    description:
      "List files and directories in the virtual workspace filesystem, similar to `ls`.",
    inputSchema: jsonSchema<typeof lsInputSchema.infer>(
      lsInputSchema.toJsonSchema() as JSONSchema7,
    ),
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
    inputSchema: jsonSchema<typeof catInputSchema.infer>(
      catInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ slug, startLine, endLine }) {
      const result = await getContentForSlug({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        originatingChatId: args.chatId ?? null,
        slug: normalizeContentSlug(slug),
        withContent: true,
      });
      if (!result.ok) {
        return {
          success: false,
          message: result.error.message,
        };
      }
      if (result.value.deleted) {
        return {
          success: false,
          message: "This file has been deleted recently.",
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
    inputSchema: jsonSchema<typeof rmInputSchema.infer>(
      rmInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ slug }) {
      const result = await deleteDraftForSlug({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        slug: normalizeContentSlug(slug),
        originatingChatId: args.chatId ?? null,
        userId: args.userId ?? null,
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
  //   inputSchema: jsonSchema<typeof mvInputSchema.infer>(
  //     mvInputSchema.toJsonSchema() as JSONSchema7,
  //   ),
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
    inputSchema: jsonSchema<typeof writeFileInputSchema.infer>(
      writeFileInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({
      slug,
      content,
      contentMarkdown,
      primaryKeyword,
      createIfMissing,
      title,
      description,
      notes,
      outline,
      articleType,
      status,
    }) {
      const normalizedSlug = normalizeContentSlug(slug);
      if (!normalizedSlug) {
        return { success: false, message: "Invalid slug." };
      }

      const existingContent = await getContentForSlug({
        db: args.db,
        organizationId: args.organizationId,
        projectId: args.projectId,
        originatingChatId: args.chatId,
        slug: normalizedSlug,
        withContent: false,
      });

      const allowCreate =
        createIfMissing === true &&
        (!existingContent.ok
          ? existingContent.error.message.toLowerCase().includes("not found")
          : false);

      if (!existingContent.ok && !allowCreate) {
        return { success: false, message: existingContent.error.message };
      }

      if (existingContent.ok && existingContent.value.deleted) {
        return {
          success: false,
          message: "This file has been deleted recently.",
        };
      }

      const existingRow = existingContent.ok
        ? existingContent.value.data.content
        : null;
      const shouldBackfillFromLive =
        existingContent.ok && existingContent.value.data.source === "live";

      const existingPrimaryKeyword = existingRow
        ? (existingRow.primaryKeyword ?? "")
        : "";

      const nextPrimaryKeyword = primaryKeyword ?? existingPrimaryKeyword;
      if (!nextPrimaryKeyword) {
        return {
          success: false,
          message:
            "primaryKeyword is required when creating a new file (or when the existing file has no primary keyword).",
        };
      }

      const nextContentMarkdown = contentMarkdown ?? content ?? undefined;
      const nextTitle =
        title === undefined && shouldBackfillFromLive
          ? existingRow?.title
          : title;
      const nextDescription =
        description === undefined && shouldBackfillFromLive
          ? existingRow?.description
          : description;
      const requestedStatus = parseDraftStatus(status);
      if (status != null && !requestedStatus) {
        return { success: false, message: `Invalid status: ${status}` };
      }

      const requestedArticleTypeRaw =
        articleType === undefined && shouldBackfillFromLive
          ? (existingRow?.articleType ?? undefined)
          : articleType;
      const requestedArticleType = parseArticleType(requestedArticleTypeRaw);
      if (articleType != null && !requestedArticleType) {
        return {
          success: false,
          message: `Invalid articleType: ${articleType}`,
        };
      }

      const result = await writeContentDraft({
        db: args.db,
        chatId: args.chatId ?? null,
        userId: args.userId ?? null,
        project: {
          id: args.projectId,
          publishingSettings,
          organizationId: args.organizationId,
        },
        createIfNotExists: true,
        lookup: {
          type: "slug",
          slug: normalizedSlug,
          primaryKeyword: nextPrimaryKeyword,
        },
        draftNewValues: {
          slug: normalizedSlug,
          primaryKeyword: nextPrimaryKeyword,
          ...(nextContentMarkdown
            ? { contentMarkdown: nextContentMarkdown }
            : {}),
          ...(nextTitle != null ? { title: nextTitle } : {}),
          ...(nextDescription != null ? { description: nextDescription } : {}),
          ...(notes != null ? { notes } : {}),
          ...(outline != null ? { outline } : {}),
          ...(requestedArticleType != null
            ? { articleType: requestedArticleType }
            : {}),
          ...(requestedStatus != null ? { status: requestedStatus } : {}),
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
        "Provide slug + the fields to set (contentMarkdown/title/description/notes/outline/etc.). Set createIfMissing=true when creating new files; include primaryKeyword when creating.",
      tool: writeFile,
    },
  ];

  return { toolDefinitions, tools };
}
