import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import { normalizePath } from "@rectangular-labs/loro-file-system";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import { CrdtType } from "loro-protocol";
import { getWebsocketContext } from "../../../context";
import type { ChatContext } from "../../../types";
import { getRoomKey } from "../../chat/get-room-key";
import { WORKSPACE_CONTENT_ROOM_ID } from "../../workspace/constants";
import { loroWriter } from "../../workspace/loro-writer";
import { withLoroTree } from "../../workspace/with-loro-tree";
import type { AgentToolDefinition } from "./utils";

function normalizeWorkspaceFilePath(file: string) {
  const withLeadingSlash = normalizePath(file);
  return withLeadingSlash.endsWith(".md")
    ? withLeadingSlash
    : `${withLeadingSlash}.md`;
}

const suggestArticlesInputSchema = type({
  suggestions: type({
    primaryKeyword: type("string").describe(
      "Primary keyword the article targets",
    ),
    slug: type("string").describe(
      "Slug / path for the article. Example: business/how-to-start-a-business",
    ),
    "notes?": type("string").describe(
      "Notes about the article. It could be areas that we want to focus on, any particular insights that we want to include, statistics that we want to cite or cover, etc.",
    ),
  }).array(),
});

export function createSuggestArticlesToolWithMetadata({
  userId,
  project,
}: {
  userId: string;
  project: NonNullable<ChatContext["cache"]["project"]>;
}) {
  const suggestArticles = tool({
    description:
      "Create suggested article files in the campaign workspace and set their metadata (status, primaryKeyword, createdAt, userId). Use subfolders as needed to create a clear topical structure.",
    inputSchema: jsonSchema<typeof suggestArticlesInputSchema.infer>(
      suggestArticlesInputSchema.toJsonSchema() as JSONSchema7,
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
            const notes = suggestion.notes?.trim() || "";
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
                    : ("queued" satisfies SeoFileStatus),
                },
                { key: "userId", value: userId },
                { key: "primaryKeyword", value: primaryKeyword },
                { key: "notes", value: notes },
              ],
              context: {
                publishingSettings: project.publishingSettings,
                userId,
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

      // TODO: make this less duplicative of what's in project.chat.ts
      const context = await getWebsocketContext();
      const roomDoc = context.roomDocumentMap.get(
        getRoomKey(WORKSPACE_CONTENT_ROOM_ID, CrdtType.Loro),
      );
      if (!roomDoc?.dirty || !roomDoc.descriptor.shouldPersist) return;
      await context.workspaceBucket.setSnapshot(
        getWorkspaceBlobUri({
          orgId: context.organizationId,
          projectId: context.projectId,
          campaignId: undefined,
        }),
        roomDoc.data,
      );
      roomDoc.dirty = false;

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

  const tools = { suggest_articles: suggestArticles } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "suggest_articles",
      toolDescription:
        "Create suggested article files for publication on the user's website. Use subfolders in the slug needed to create a clear topical structure.",
      toolInstruction:
        "Provide article suggestions in the form of { primaryKeyword, slug }. The primary keyword will be used to target the article for SEO/GEO optimization. The slug will be where the article will reside on the site. Slug can and should include folders (e.g. `business/how-to-start-a-business`) to create a clear topical structure so that we can build relevant topical authority appropriately. This tool will put the article up as suggested in the planner so that the user can review and publish them as needed.",
      tool: suggestArticles,
    },
  ];

  return { toolDefinitions, tools };
}
