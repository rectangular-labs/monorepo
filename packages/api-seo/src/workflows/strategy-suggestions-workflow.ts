import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { openai } from "@ai-sdk/openai";
import { initAuthHandler } from "@rectangular-labs/auth";
import { formatStrategyGoal } from "@rectangular-labs/core/format/strategy-goal";
import { strategySuggestionSchema } from "@rectangular-labs/core/schemas/strategy-parsers";
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
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
import { apiEnv } from "../env";
import { createDataforseoToolWithMetadata } from "../lib/ai/tools/dataforseo-tool";
import { createGscToolWithMetadata } from "../lib/ai/tools/google-search-console-tool";
import { createStrategyToolsWithMetadata } from "../lib/ai/tools/strategy-tools";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { formatBusinessBackground } from "../lib/ai/utils/format-business-background";
import { logAgentStep } from "../lib/ai/utils/log-agent-step";
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
        console.error(
          `[SeoStrategySuggestionsWorkflow] ${projectResult.error}`,
        );
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
      {
        timeout: "10 minutes",
      },
      async () => {
        logInfo("creating strategy suggestion tools", {
          instanceId: event.instanceId,
          projectId: input.projectId,
        });
        const { tools: webTools } = createWebToolsWithMetadata(
          project,
          this.env.CACHE,
        );
        const dataforseoTools = createDataforseoToolWithMetadata(
          project,
          this.env.CACHE,
        );
        const db = createDb();
        const strategyTools = createStrategyToolsWithMetadata({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
        });
        const env = apiEnv();
        const auth = initAuthHandler({
          baseURL: env.SEO_URL,
          db,
          encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
          fromEmail: env.AUTH_SEO_FROM_EMAIL,
          inboundApiKey: env.SEO_INBOUND_API_KEY,
          credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
          discordClientId: env.AUTH_SEO_DISCORD_ID,
          discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
          githubClientId: env.AUTH_SEO_GITHUB_ID,
          githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
          googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
          googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
        });
        const gscIntegrationResult = await getGscIntegrationForProject({
          db,
          projectId: project.id,
          organizationId: project.organizationId,
          authOverride: auth,
        });
        if (!gscIntegrationResult.ok) {
          throw new Error(
            `Something went wrong getting gsc integration ${gscIntegrationResult.error}`,
            {
              cause: gscIntegrationResult.error,
            },
          );
        }

        const gscTools = createGscToolWithMetadata({
          accessToken: gscIntegrationResult.value?.accessToken ?? null,
          siteUrl: gscIntegrationResult.value?.config?.domain ?? null,
          siteType: gscIntegrationResult.value?.config?.propertyType ?? null,
        });

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

        const system = `You are an SEO strategist generating strategy suggestions.

## Objective
- Propose strategy suggestions that fit the project's context and current work.
- Avoid duplicates by name and intent. Learn from dismissed strategies and their reasons.

## Instructions
${input.instructions}

## Data Usage
- Use available tools (Google Search Console, DataForSEO, web search) directly to ground recommendations.
- If you need more context about a specific strategy, use get_strategy_details.
- If Google Search Console is not available, rely on competitor and keyword tools plus public site info.

## Existing Strategies (compact)
${existingStrategies}

## Output Requirements
- Keep each strategy concise and actionable.
- Use realistic targets for goals and success criteria.
- Output MUST match the provided JSON schema.`;
        logInfo("Starting strategy suggestion generation", {
          instanceId: event.instanceId,
          projectId: input.projectId,
        });
        const outputResult = await generateText({
          model: openai("gpt-5.2"),
          system,
          tools: {
            ...webTools,
            ...dataforseoTools.tools,
            ...strategyTools.tools,
            ...(gscIntegrationResult.value ? gscTools.tools : {}),
          },
          prompt: `Project website: ${project.websiteUrl}
Business background:${formatBusinessBackground(project.businessBackground)}

Generate strategy suggestions now.`,
          stopWhen: [stepCountIs(40)],
          onStepFinish: (step) => {
            logAgentStep(logInfo, "step to generate suggestion finished", step);
          },
          experimental_output: Output.object({
            schema: jsonSchema<{
              suggestions: (typeof strategySuggestionSchema.infer)[];
            }>(
              type({
                suggestions: strategySuggestionSchema.array(),
              }).toJsonSchema() as JSONSchema7,
            ),
          }),
        });

        return outputResult.experimental_output;
      },
    );

    const createdStrategyIds = await step.do(
      "save strategy suggestions",
      async () => {
        const db = createDb();
        const strategyResult = await createStrategies(
          db,
          suggestionResult.suggestions.map((suggestion) => {
            return {
              ...suggestion,
              organizationId: project.organizationId,
              projectId: project.id,
              status: "suggestion",
            };
          }),
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
