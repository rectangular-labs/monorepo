import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
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
import { createStrategyAdvisorAgent } from "../lib/ai/agents/strategy-advisor";
import { summarizeAgentInvocation } from "../lib/ai/utils/agent-telemetry";
import { createWorkflowAuth } from "../lib/ai/utils/auth-init";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoStrategySuggestionsWorkflow] ${message}`, data ?? {});
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
                    `phases:${strategy.phases?.length ?? 0}`,
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
                  required: ["name", "motivation", "description", "goal"],
                  properties: {
                    name: { type: "string" },
                    motivation: { type: "string" },
                    description: { type: ["string", "null"] },
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
