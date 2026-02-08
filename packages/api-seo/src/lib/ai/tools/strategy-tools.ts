import type { DB } from "@rectangular-labs/db";
import { getStrategyDetails } from "@rectangular-labs/db/operations";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { AgentToolDefinition } from "./utils";

const strategyDetailsInputSchema = type({
  strategyId: "string.uuid",
  "snapshotLimit?": "number",
});

export function createStrategyToolsWithMetadata(args: {
  db: DB;
  projectId: string;
  organizationId: string;
}) {
  const getStrategyDetailsTool = tool({
    description:
      "Fetch detailed strategy information, including phases, phase contents, and recent snapshots.",
    inputSchema: jsonSchema<typeof strategyDetailsInputSchema.infer>(
      strategyDetailsInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({ strategyId, snapshotLimit = 5 }) {
      const detailResult = await getStrategyDetails({
        db: args.db,
        projectId: args.projectId,
        strategyId,
        organizationId: args.organizationId,
      });
      if (!detailResult.ok) {
        return { success: false, message: detailResult.error.message };
      }
      if (!detailResult.value) {
        return { success: false, message: "Strategy not found" };
      }

      const snapshots = await args.db.query.seoStrategySnapshot.findMany({
        where: (table, { eq, isNull, and }) =>
          and(eq(table.strategyId, strategyId), isNull(table.deletedAt)),
        orderBy: (fields, { desc }) => [desc(fields.takenAt)],
        limit: Math.max(1, Math.min(20, snapshotLimit)),
        with: {
          contents: {
            where: (table, { isNull }) => isNull(table.deletedAt),
            with: {
              contentDraft: {
                columns: {
                  contentMarkdown: false,
                  outline: false,
                },
              },
            },
          },
        },
      });

      return {
        success: true,
        strategy: detailResult.value,
        snapshots,
      };
    },
  });

  const tools = {
    get_strategy_details: getStrategyDetailsTool,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "get_strategy_details",
      toolDescription:
        "Fetch full strategy details including phases, content items, and recent snapshots.",
      toolInstruction:
        "Use when you need full context for a specific strategy. Provide strategyId and optional snapshotLimit.",
      tool: getStrategyDetailsTool,
    },
  ];

  return { toolDefinitions, tools };
}
