import type { DB } from "@rectangular-labs/db";
import {
  getStrategyDetails,
  listStrategiesByProjectId,
} from "@rectangular-labs/db/operations";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { AgentToolDefinition } from "./utils";

const listStrategiesInputSchema = type({
  "includeSuggestions?": "boolean",
  "includeArchived?": "boolean",
  "limit?": "number",
});

const strategyDetailsInputSchema = type({
  strategyId: "string.uuid",
  "snapshotLimit?": "number",
});

export function createStrategyToolsWithMetadata(args: {
  db: DB;
  projectId: string;
}) {
  const listStrategies = tool({
    description:
      "List existing strategies for the project in a compact, token-efficient format.",
    inputSchema: jsonSchema<typeof listStrategiesInputSchema.infer>(
      listStrategiesInputSchema.toJsonSchema() as JSONSchema7,
    ),
    async execute({
      includeSuggestions = false,
      includeArchived = false,
      limit,
    }) {
      const result = await listStrategiesByProjectId({
        db: args.db,
        projectId: args.projectId,
      });
      if (!result.ok) {
        return { success: false, message: result.error.message };
      }

      const filtered = result.value.filter((strategy) => {
        if (!includeSuggestions && strategy.status === "suggestion") {
          return false;
        }
        if (!includeArchived && strategy.status === "dismissed") {
          return false;
        }
        return true;
      });

      const limited =
        typeof limit === "number"
          ? filtered.slice(0, Math.max(0, limit))
          : filtered;
      const strategies = limited.map((strategy) => ({
        id: strategy.id,
        name: strategy.name,
        status: strategy.status,
        goal: strategy.goal,
        updatedAt:
          strategy.updatedAt?.toISOString?.() ??
          String(strategy.updatedAt ?? ""),
        phaseCount: strategy.phases?.length ?? 0,
      }));

      return {
        success: true,
        count: strategies.length,
        strategies,
      };
    },
  });

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
                  notes: false,
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
    list_strategies: listStrategies,
    get_strategy_details: getStrategyDetailsTool,
  } as const;

  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "list_strategies",
      toolDescription:
        "List existing project strategies in a compact format (id, name, status, goal, phase count).",
      toolInstruction:
        "Use first to avoid duplicating active strategies. Default excludes suggestions/archived unless needed. Limit results for token efficiency.",
      tool: listStrategies,
    },
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
