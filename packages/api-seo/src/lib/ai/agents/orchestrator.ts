import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import {
  ARTICLE_TYPES,
  type ArticleType,
} from "@rectangular-labs/core/schemas/content-parsers";
import type { GscConfig } from "@rectangular-labs/core/schemas/integration-parsers";
import { CONTENT_ROLES } from "@rectangular-labs/core/schemas/strategy-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import { hasToolCall, jsonSchema, stepCountIs, ToolLoopAgent, tool } from "ai";
import { queueSeoWriteArticleTask } from "../../task";
import { buildOrchestratorInstructions } from "../instructions/orchestrator";
import { createAskQuestionsTool } from "../tools/ask-question-tool";
import { createDataAccessTools } from "../tools/data-access-tool";
import { createSettingsTools } from "../tools/settings-tools";
import {
  summarizeAgentInvocation,
  summarizeAgentStep,
} from "../utils/agent-telemetry";
import { wrappedOpenAI } from "../utils/wrapped-language-model";
import { createStrategyAdvisorAgent } from "./strategy-advisor";

interface OrchestratorContext {
  db: DB;
  project: typeof schema.seoProject.$inferSelect;
  chatId: string | null;
  userId: string;
  cacheKV: KVNamespace;
  gscProperty: {
    config: GscConfig;
    accessToken?: string | null;
  } | null;
}

/**
 * Create the chat orchestrator.
 *
 * The orchestrator is a ToolLoopAgent that:
 * - Delegates analysis/strategy/diagnostics to the Strategy Advisor subagent
 * - Delegates writing/editing to the Writer subagent
 * - Owns interactive tools directly (settings, asking questions) since these
 *   need to pause the stream for user interaction
 *
 * The orchestrator does NOT do heavy reasoning — it classifies intent,
 * delegates to subagents, and synthesizes their results for the user.
 */
export function createOrchestrator(ctx: OrchestratorContext) {
  // Create the Strategy Advisor subagent
  const { agent: strategyAdvisor } = createStrategyAdvisorAgent({
    db: ctx.db,
    project: ctx.project,
    cacheKV: ctx.cacheKV,
    gscProperty: ctx.gscProperty,
  });

  // Orchestrator owns workspace tools directly for interactive use
  const askQuestionsTool = createAskQuestionsTool();
  const dataAccessTools = createDataAccessTools({
    db: ctx.db,
    organizationId: ctx.project.organizationId,
    projectId: ctx.project.id,
  });
  const settingsTools = createSettingsTools({
    context: {
      db: ctx.db,
      projectId: ctx.project.id,
      organizationId: ctx.project.organizationId,
    },
  });
  const hasGsc = !!(
    ctx.gscProperty?.accessToken &&
    ctx.gscProperty?.config.domain &&
    ctx.gscProperty?.config.propertyType
  );
  const instructions = buildOrchestratorInstructions({
    project: ctx.project,
    gscConnected: hasGsc,
    gscDomain: ctx.gscProperty?.config.domain,
  });

  const advise = tool({
    description:
      "Delegate SEO/GEO analysis, strategy, diagnostics, keyword research, competitor analysis, or performance questions to the Strategy Advisor. Provide a clear, specific task description.",
    inputSchema: jsonSchema<{ task: string; strategyId?: string }>({
      type: "object",
      additionalProperties: false,
      required: ["task"],
      properties: {
        task: {
          type: "string",
          description:
            "Task to delegate to the Strategy Advisor. It should include all the details on what you want the Strategy Advisor to do. Anticipate and ask for any additional information that the Strategy Advisor may need to complete the task ahead of time before invoking this tool.",
        },
        strategyId: {
          type: "string",
          description: "The ID of the strategy to focus on.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          task: "Analyze why blog traffic dropped in the last 8 weeks and suggest the top 3 actions.",
        },
      },
      {
        input: {
          task: "Review this strategy and propose improvements for phase 2.",
          strategyId: "00000000-0000-0000-0000-000000000000",
        },
      },
    ],
    execute: async ({ task, strategyId }) => {
      const prompt = strategyId
        ? `${task}\n\nStrategy ID to focus on: ${strategyId}`
        : task;

      const result = await strategyAdvisor.generate({
        prompt,
      });
      const telemetry = summarizeAgentInvocation(result.steps);
      console.log("[orchestrator] advise subagent completed", telemetry);

      return {
        summary: result.text,
        telemetry,
      };
    },
    toModelOutput: ({ output }) => ({
      type: "content",
      value: [
        {
          type: "text" as const,
          text: [
            "Strategy Advisor result:",
            `- steps: ${output.telemetry.stepCount}`,
            `- tool calls: ${output.telemetry.toolCallCount}`,
            output.telemetry.estimatedCostUsd != null
              ? `- est. cost (USD): ${output.telemetry.estimatedCostUsd}`
              : "- est. cost (USD): unavailable",
            `- summary: ${output.summary}`,
          ].join("\n"),
        },
      ],
    }),
  });

  const write = tool({
    description:
      "Queue article writing or rewriting in the background. For an existing draft, pass draftId. For a new article, pass slug and primaryKeyword. If you're reusing a slug that may already contain generated content and the user explicitly confirmed overwriting it, set confirmOverwrite to true.",
    inputSchema: jsonSchema<{
      task: string;
      draftId?: string;
      slug?: string;
      primaryKeyword?: string;
      title?: string;
      notes?: string;
      strategyId?: string;
      role?: "pillar" | "supporting";
      articleType?: ArticleType;
      confirmOverwrite?: boolean;
    }>({
      type: "object",
      additionalProperties: false,
      required: ["task"],
      properties: {
        task: {
          type: "string",
          description: "The task to delegate to the Writer.",
        },
        draftId: {
          type: "string",
          description:
            "The ID of an existing draft to write or rewrite. Use this when it is already clear that we are updating a specific draft.",
        },
        slug: {
          type: "string",
          description:
            "SEO/GEO optimized Slug for a new article draft. Required for new article generation when draftId is not provided.",
        },
        primaryKeyword: {
          type: "string",
          description:
            "Primary keyword for a new article draft. Required when creating a new draft.",
        },
        title: {
          type: "string",
          description:
            "Optional draft title to persist before queueing the writer.",
        },
        notes: {
          type: "string",
          description:
            "Optional notes or instructions to persist on the draft before queueing the writer.",
        },
        strategyId: {
          type: "string",
          description:
            "Optional strategy id to associate with the draft before queueing the writer.",
        },
        role: {
          type: "string",
          enum: [...CONTENT_ROLES],
          description: "Optional content role for the draft.",
        },
        articleType: {
          type: "string",
          enum: [...ARTICLE_TYPES],
          description: "Optional article type to persist before queueing.",
        },
        confirmOverwrite: {
          type: "boolean",
          description:
            "Set to true only when the user clearly confirmed that it's okay to overwrite an already-generated draft.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          task: "Write a 1,200-word article targeting 'invoice automation software' with practical examples.",
          slug: "invoice-automation-software",
          primaryKeyword: "invoice automation software",
        },
      },
      {
        input: {
          task: "Improve this draft intro and tighten headings for clarity.",
          draftId: "00000000-0000-0000-0000-000000000000",
        },
      },
      {
        input: {
          task: "Rewrite this article to focus more on implementation detail.",
          slug: "invoice-automation-software",
          primaryKeyword: "invoice automation software",
          confirmOverwrite: true,
        },
      },
    ],
    execute: async ({
      task,
      draftId,
      slug,
      primaryKeyword,
      title,
      notes,
      strategyId,
      role,
      articleType,
      confirmOverwrite,
    }) => {
      if (!draftId && (!slug || !primaryKeyword)) {
        return {
          status: "missing_required_input" as const,
          message:
            "Creating a new article requires both slug and primaryKeyword.",
        };
      }

      const target = draftId
        ? { draftId }
        : slug && primaryKeyword
          ? { slug, primaryKeyword }
          : null;
      if (!target) {
        return {
          status: "missing_required_input" as const,
          message:
            "Creating a new article requires both slug and primaryKeyword.",
        };
      }

      const result = await queueSeoWriteArticleTask({
        db: ctx.db,
        projectId: ctx.project.id,
        organizationId: ctx.project.organizationId,
        userId: ctx.userId,
        chatId: ctx.chatId,
        confirmOverwrite,
        target,
        metadata: {
          title,
          notes,
          strategyId: strategyId || undefined,
          role,
          articleType,
        },
      });

      if (!result.ok) {
        return {
          status: "error" as const,
          message: result.error.message,
        };
      }

      if (result.value.status === "queued") {
        console.log("[orchestrator] write task queued", {
          task,
          draftId: result.value.draft.id,
          taskRunId: result.value.draft.generatedByTaskRunId,
          status: result.value.draft.status,
        });
      }

      return result.value.status === "queued"
        ? {
            status: "queued" as const,
            draftId: result.value.draft.id,
            draftStatus: result.value.draft.status,
          }
        : result.value.status === "in_progress"
          ? {
              status: "in_progress" as const,
              draftId: result.value.draft.id,
              draftStatus: result.value.draft.status,
              message:
                "This draft is already being generated in the background.",
            }
          : {
              status: "confirmation_required" as const,
              draftId: result.value.draft.id,
              draftStatus: result.value.draft.status,
              message:
                "This draft already has generated content. Confirm with the user before re-queueing to overwrite it.",
            };
    },
    toModelOutput: ({ output }) => ({
      type: "content",
      value: [
        {
          type: "text" as const,
          text:
            output.status === "queued"
              ? [
                  "Writer task queued:",
                  `- draftId: ${output.draftId}`,
                  `- draft status: ${output.draftStatus}`,
                ].join("\n")
              : output.status === "in_progress"
                ? [
                    "Writer task already in progress:",
                    `- draftId: ${output.draftId}`,
                    `- draft status: ${output.draftStatus}`,
                    `- message: ${output.message}`,
                  ].join("\n")
                : output.status === "confirmation_required"
                  ? [
                      "Writer task requires confirmation:",
                      `- draftId: ${output.draftId}`,
                      `- draft status: ${output.draftStatus}`,
                      `- message: ${output.message}`,
                    ].join("\n")
                  : `Writer task could not be queued: ${output.message}`,
        },
      ],
    }),
  });

  const tools = {
    advise,
    write,
    // Interactive workspace tools owned directly by orchestrator
    ...askQuestionsTool.tools,
    ...dataAccessTools.tools,
    ...settingsTools.tools,
  };

  const agent = new ToolLoopAgent({
    id: "seo-orchestrator",
    model: wrappedOpenAI("gpt-5.2"),
    instructions,
    tools,
    stopWhen: [
      // Stop on interactive tools that need user input
      hasToolCall("ask_questions"),
      hasToolCall("manage_integrations"),
      // Safety limit
      stepCountIs(25),
    ],
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
      } satisfies OpenAIResponsesProviderOptions,
    },
    onStepFinish: (step) => {
      console.log("[orchestrator] step finished", summarizeAgentStep(step));
    },
  });

  return agent;
}
