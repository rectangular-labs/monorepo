import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import type {
  strategyKeywordUniverseSchema,
  strategyLlmQueriesSchema,
} from "@rectangular-labs/core/schemas/keyword-parsers";
import type { strategySuggestionSchema } from "@rectangular-labs/core/schemas/strategy-parsers";
import type {
  seoStrategySuggestionsTaskInputSchema,
  seoStrategySuggestionsTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import {
  createStrategies,
  getSeoProjectById,
  listStrategiesByProjectId,
} from "@rectangular-labs/db/operations";
import type { JSONSchema7 } from "ai";
import { createStrategyAdvisorAgent } from "../lib/ai/agents/strategy-advisor";
import { summarizeAgentInvocation } from "../lib/ai/utils/agent-telemetry";
import { createWorkflowAuth } from "../lib/ai/utils/auth-init";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoStrategySuggestionsWorkflow] ${message}`, data ?? {});
}

const keywordUniverseJsonSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  description:
    "Clustered keyword universe for the strategy. Focus on one core keyword plus compact BOFU/supporting variants per cluster.",
  properties: {
    items: {
      type: "array",
      description:
        "Keywords the strategy should target. Every item belongs to a page-sized cluster.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["keyword", "clusterId", "source", "category"],
        properties: {
          keyword: {
            type: "string",
            description:
              "Keyword phrase to target. Prefer compact, bottom-of-funnel phrasing over broad informational head terms.",
          },
          clusterId: {
            type: "string",
            description:
              "Stable cluster identifier grouping keywords that should map to the same eventual page.",
          },
          source: {
            type: "object",
            additionalProperties: false,
            required: ["type"],
            description:
              "Provenance for the keyword. During strategy generation this should always be strategyGeneration.",
            properties: {
              type: {
                type: "string",
                enum: ["strategyGeneration"],
                description:
                  "Source type for the keyword. Use strategyGeneration for milestone 2 suggestions.",
              },
            },
          },
          category: {
            type: "string",
            enum: ["core", "supporting", "fanOut"],
            description:
              "Keyword role within the cluster. Use core for the primary keyword and supporting for adjacent BOFU variants.",
          },
        },
      },
    },
  },
};

const llmQueriesJsonSchema: JSONSchema7 = {
  type: "object",
  additionalProperties: false,
  required: ["items"],
  description:
    "Conversational LLM queries the strategy should be visible for, aligned to the same keyword opportunity.",
  properties: {
    items: {
      type: "array",
      description:
        "Natural-language prompts users may ask AI assistants where this strategy's content should appear or be cited.",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["query", "rationale"],
        properties: {
          query: {
            type: "string",
            description:
              "Natural-language question or prompt a user might ask an AI assistant.",
          },
          rationale: {
            type: ["string", "null"],
            description:
              "Why this query matters for the strategy and how it connects to the keyword universe.",
          },
        },
      },
    },
  },
};

type StrategyKeywordUniverse = typeof strategyKeywordUniverseSchema.infer;
type StrategyLlmQueries = typeof strategyLlmQueriesSchema.infer;
type StrategySuggestion = typeof strategySuggestionSchema.infer;

function normalizeKeywordUniverse(
  keywordUniverse: StrategySuggestion["keywordUniverse"],
): StrategyKeywordUniverse {
  return {
    version: 1,
    items: keywordUniverse.items.map((item) => ({
      id: crypto.randomUUID(),
      keyword: item.keyword,
      clusterId: item.clusterId,
      status: "active",
      source: item.source,
      category: item.category,
      intent: null,
      difficulty: null,
      searchVolume: null,
      cpc: null,
      cpcCompetitionLevel: null,
    })),
  };
}

function normalizeLlmQueries(
  llmQueries: StrategySuggestion["llmQueries"],
): StrategyLlmQueries {
  return {
    version: 1,
    items: llmQueries.items.map((item) => ({
      id: crypto.randomUUID(),
      query: item.query,
      rationale: item.rationale,
      status: "active",
    })),
  };
}

type StrategySuggestionsInput =
  typeof seoStrategySuggestionsTaskInputSchema.infer;
export type SeoStrategySuggestionsWorkflowBinding =
  Workflow<StrategySuggestionsInput>;

export class SeoStrategySuggestionsWorkflow extends WorkflowEntrypoint<
  {
    CACHE: InitialContext["cacheKV"];
  },
  StrategySuggestionsInput
> {
  async run(
    event: WorkflowEvent<StrategySuggestionsInput>,
    step: WorkflowStep,
  ) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      projectId: input.projectId,
    });

    const project = await step.do("load project", async () => {
      const db = createDb();
      const projectResult = await getSeoProjectById(db, input.projectId);
      if (!projectResult.ok) {
        throw projectResult.error;
      }
      if (!projectResult.value) {
        throw new NonRetryableError(
          `Missing project for Project ID: ${input.projectId}`,
        );
      }
      return projectResult.value;
    });

    const suggestionResult = await step.do(
      "generate strategy suggestions",
      { timeout: "10 minutes" },
      async () => {
        const db = createDb();

        const gscIntegrationResult = await getGscIntegrationForProject({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
          authOverride: createWorkflowAuth(db),
        });
        if (!gscIntegrationResult.ok) {
          throw gscIntegrationResult.error;
        }

        const existingStrategiesResult = await listStrategiesByProjectId({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
        });
        if (!existingStrategiesResult.ok) {
          throw existingStrategiesResult.error;
        }

        const existingStrategies =
          existingStrategiesResult.value.length > 0
            ? existingStrategiesResult.value
                .map((strategy) => {
                  const goal = strategy.goal
                    ? formatStrategyGoal(strategy.goal)
                    : "none";
                  const updatedAt = strategy.updatedAt
                    ?.toISOString?.()
                    ?.slice(0, 10);
                  const dismissalReason = strategy.dismissalReason
                    ? `dismissal reason: ${strategy.dismissalReason}`
                    : "";
                  return [
                    `- [${strategy.status}] "${strategy.name}"`,
                    `id: ${strategy.id}`,
                    `goal: ${goal}`,
                    `keywords:${strategy.keywordUniverse?.items.length ?? 0}`,
                    `llmQueries:${strategy.llmQueries?.items.length ?? 0}`,
                    `updated:${updatedAt ?? "unknown"}`,
                    dismissalReason,
                  ]
                    .filter(Boolean)
                    .join("|");
                })
                .join("\n")
            : "- none";

        const { agent } = createStrategyAdvisorAgent<{
          suggestions: (typeof strategySuggestionSchema.infer)[];
        }>({
          db,
          project,
          cacheKV: this.env.CACHE,
          jsonSchema: {
            type: "object",
            additionalProperties: false,
            required: ["suggestions"],
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: [
                    "name",
                    "motivation",
                    "goal",
                    "keywordUniverse",
                    "llmQueries",
                  ],
                  properties: {
                    name: { type: "string" },
                    motivation: { type: "string" },
                    goal: {
                      type: "object",
                      additionalProperties: false,
                      required: ["metric", "target", "timeframe"],
                      properties: {
                        metric: {
                          type: "string",
                          enum: ["clicks", "impressions", "avgPosition"],
                        },
                        target: { type: "number" },
                        timeframe: {
                          type: "string",
                          enum: ["monthly", "total"],
                        },
                      },
                    },
                    keywordUniverse: keywordUniverseJsonSchema,
                    llmQueries: llmQueriesJsonSchema,
                  },
                },
              },
            },
          },
          gscProperty: gscIntegrationResult.value
            ? {
                config: gscIntegrationResult.value.config,
                accessToken: gscIntegrationResult.value.accessToken,
              }
            : null,
        });

        const result = await agent.generate({
          prompt: `Generate strategy suggestions for this project.

<instructions>
${input.instructions}
</instructions>

<schema-requirements>
- Every active cluster must include exactly one item with category "core".
- Return llmQueries aligned to the same keyword opportunity.
</schema-requirements>

<existing-strategies>
${existingStrategies}
</existing-strategies>`,
        });
        const telemetry = summarizeAgentInvocation(result.steps);
        logInfo("strategy advisor invocation complete", {
          instanceId: event.instanceId,
          projectId: project.id,
          ...telemetry,
        });

        return result.output;
      },
    );

    const createdStrategyIds = await step.do(
      "save strategy suggestions",
      async () => {
        const db = createDb();
        const strategyResult = await createStrategies(
          db,
          suggestionResult.suggestions.map((suggestion) => ({
            ...suggestion,
            keywordUniverse: normalizeKeywordUniverse(
              suggestion.keywordUniverse,
            ),
            llmQueries: normalizeLlmQueries(suggestion.llmQueries),
            organizationId: project.organizationId,
            projectId: project.id,
            status: "suggestion",
          })),
        );
        if (!strategyResult.ok) {
          throw strategyResult.error;
        }
        return strategyResult.value.map((strategy) => strategy.id);
      },
    );

    logInfo("complete", {
      instanceId: event.instanceId,
      projectId: project.id,
      createdStrategyCount: createdStrategyIds.length,
    });

    return {
      type: "seo-generate-strategy-suggestions",
      projectId: project.id,
      strategyIds: createdStrategyIds,
    } satisfies typeof seoStrategySuggestionsTaskOutputSchema.infer;
  }
}
