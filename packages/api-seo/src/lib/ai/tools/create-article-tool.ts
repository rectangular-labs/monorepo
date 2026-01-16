import { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { writeContentDraft } from "../../content/write-content-draft";
import type { AgentToolDefinition } from "./utils";

const createArticleInputSchema = type({
  primaryKeyword: type("string").describe(
    "Primary keyword the article targets (required).",
  ),
  slug: type("string").describe(
    "SEO/GEO optimized slug for the targeted primary keyword. Must start with '/'. e.g. /business/how-to-start-a-business.",
  ),
  "title?": type("string|null").describe(
    "Article title should only be present if explicitly provided by the user or confirmed by the user in response to your suggestion.",
  ),
  "description?": type("string|null").describe(
    "Article description should only be present if explicitly provided by the user or confirmed by the user in response to your suggestion.",
  ),
  "outline?": type("string|null").describe(
    "Article outline should only be present if explicitly provided by the user or worked on together with the user. This should be a list of H2/H3 headings that the article will cover along with any additional context or notes for each section.",
  ),
  "articleType?": articleTypeSchema
    .or(type.null)
    .describe(
      "Article type should only be present if explicitly provided by the user or confirmed by the user in response to your suggestion.",
    ),
  "notes?": type("string|null").describe(
    "Notes or guidance on what the user wants to focus on in the article/section/topic. No need to be provided if we already received/worked on an outline together with the user.",
  ),
});

export function createCreateArticleToolWithMetadata({
  userId,
  project,
  context,
}: {
  userId: string;
  project: Pick<
    typeof schema.seoProject.$inferSelect,
    "publishingSettings" | "id" | "organizationId"
  >;
  context: {
    db: DB;
    chatId: string | null;
  };
}) {
  const createArticle = tool({
    description:
      "Create a new article draft for a primary keyword, optionally including title, description, outline, article type, and notes. Use this when the user wants to create a new article.",
    inputSchema: jsonSchema<typeof createArticleInputSchema.infer>(
      createArticleInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({
      primaryKeyword,
      slug,
      title,
      description,
      outline,
      articleType,
      notes,
    }) {
      const keyword = primaryKeyword.trim();
      if (!keyword) {
        return { success: false, message: "primaryKeyword is required." };
      }

      if (!slug.startsWith("/")) {
        return { success: false, message: "slug must start with '/'." };
      }

      const status = project.publishingSettings?.requireSuggestionReview
        ? "suggested"
        : "queued";

      const writeResult = await writeContentDraft({
        db: context.db,
        userId,
        projectId: project.id,
        organizationId: project.organizationId,
        chatId: context.chatId,
        lookup: { type: "slug", slug, primaryKeyword: keyword },
        draftNewValues: {
          slug,
          status,
          primaryKeyword: keyword,
          title: title?.trim(),
          description: description?.trim(),
          outline: outline?.trim(),
          articleType,
          notes: notes?.trim(),
        },
      });

      if (!writeResult.ok) {
        return { success: false, message: writeResult.error.message };
      }

      return {
        success: true,
        message: "Article draft created.",
        slug,
        status,
        primaryKeyword,
      };
    },
  });

  const tools = { create_article: createArticle } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "create_article",
      toolDescription:
        "Create a new article draft for a primary keyword and SEO/GEO optimized slug (optionally with title, description, outline, articleType, and notes).",
      toolInstruction: [
        "Provide at least primaryKeyword and SEO/GEO optimized slug. Provide title/description/outline/articleType if the user explicitly provided them (or confirmed your suggestion).",
        "If the user only gave guidance without confirming fields, put those pointers in notes.",
        "If only primaryKeyword and slug are available, pass just that and let the tool fill the rest.",
        "This tool creates a draft and triggers planner or writer workflows based on project publishing settings.",
      ].join("\n"),
      tool: createArticle,
    },
  ];

  return { toolDefinitions, tools };
}
