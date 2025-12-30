import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import { normalizePath } from "@rectangular-labs/loro-file-system";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { ChatContext } from "../../../types";
import { loroWriter } from "../../workspace/loro-writer";
import { withLoroTree } from "../../workspace/with-loro-tree";
import type { AgentToolDefinition } from "./utils";

function normalizeWorkspaceFilePath(file: string) {
  const withLeadingSlash = normalizePath(file);
  return withLeadingSlash.endsWith(".md")
    ? withLeadingSlash
    : `${withLeadingSlash}.md`;
}

const makeSuggestionsInputSchema = type({
  suggestions: type({
    primaryKeyword: type("string").describe(
      "Primary keyword the article targets",
    ),
    slug: type("string").describe(
      "Slug / path for the article. Example: business/how-to-start-a-business",
    ),
  }).array(),
});

export function createMakeSuggestionsToolWithMetadata({
  userId,
  project,
}: {
  userId: string;
  project: NonNullable<ChatContext["cache"]["project"]>;
}) {
  const makeSuggestions = tool({
    description:
      "Create suggested article files in the campaign workspace and set their metadata (status, primaryKeyword, createdAt, userId).",
    inputSchema: jsonSchema<typeof makeSuggestionsInputSchema.infer>(
      makeSuggestionsInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ suggestions }) {
      const now = new Date().toISOString();

      const created: {
        path: string;
        primaryKeyword: string;
      }[] = [];

      const skipped: { slug: string; reason: string }[] = [];

      await withLoroTree({
        shouldPersist: true,
        handler: async ({ tree }) => {
          for (const suggestion of suggestions) {
            const primaryKeyword = suggestion.primaryKeyword.trim();
            const normalizedPath = normalizeWorkspaceFilePath(suggestion.slug);
            if (!primaryKeyword) {
              skipped.push({
                slug: suggestion.slug,
                reason: "primaryKeyword is required",
              });
              continue;
            }
            if (!normalizedPath) {
              skipped.push({
                slug: suggestion.slug,
                reason: "slug is required",
              });
              continue;
            }

            const writeResult = await loroWriter.writeToFile({
              tree,
              path: normalizedPath,
              content: "",
              createIfMissing: true,
              metadata: [
                { key: "createdAt", value: now },
                {
                  key: "status",
                  value: project.publishingSettings?.requireSuggestionReview
                    ? ("suggested" satisfies SeoFileStatus)
                    : ("planned" satisfies SeoFileStatus),
                },
                { key: "userId", value: userId },
                { key: "primaryKeyword", value: primaryKeyword },
              ],
              context: {
                publishingSettings: project.publishingSettings,
              },
            });

            if (!writeResult.success) {
              skipped.push({
                slug: suggestion.slug,
                reason: writeResult.message,
              });
              continue;
            }

            created.push({ path: normalizedPath, primaryKeyword });
          }
        },
      });

      return {
        created,
        skipped,
        message:
          created.length > 0
            ? `Created ${created.length} suggestion file(s).`
            : "No suggestion files created.",
      };
    },
  });

  const tools = { make_suggestions: makeSuggestions } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "make_suggestions",
      toolDescription:
        "Create suggestion files (slug-based paths) in the workspace and mark them as suggested with metadata.",
      toolInstruction:
        "Provide suggestions[] with { primaryKeyword, slug }. Slug can include folders (e.g. `business/how-to-start-a-business`). This will create `/.../.md` files and set status='suggested' so they appear in the planner.",
      tool: makeSuggestions,
    },
  ];

  return { toolDefinitions, tools };
}
