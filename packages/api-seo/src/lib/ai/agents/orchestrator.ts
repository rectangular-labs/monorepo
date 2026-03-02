import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { GscConfig } from "@rectangular-labs/core/schemas/integration-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import {
  hasToolCall,
  jsonSchema,
  stepCountIs,
  ToolLoopAgent,
  tool,
  type UIMessage,
} from "ai";
import type { createPublicImagesBucket } from "../../bucket";
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
import { createWriterAgent as createWriterSubagent } from "./writer";

interface OrchestratorContext {
  db: DB;
  project: typeof schema.seoProject.$inferSelect;
  messages: UIMessage[];
  cacheKV: KVNamespace;
  publicImagesBucket: ReturnType<typeof createPublicImagesBucket>;
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

  // Create the Writer subagent (chat mode)
  const { agent: writerAgent } = createWriterSubagent({
    db: ctx.db,
    project: ctx.project,
    messages: ctx.messages,
    cacheKV: ctx.cacheKV,
    publicImagesBucket: ctx.publicImagesBucket,
    mode: "chat",
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
            `- summary: ${output.summary.slice(0, 1_200)}`,
          ].join("\n"),
        },
      ],
    }),
  });

  const write = tool({
    description:
      "Delegate article writing or editing to the Writer. Provide a clear task description of what to write or improve. The writer will research, plan, write, and self-review the content.",
    inputSchema: jsonSchema<{ task: string; draftId?: string }>({
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
          description: "The ID of the draft to edit.",
        },
      },
    }),
    inputExamples: [
      {
        input: {
          task: "Write a 1,200-word article targeting 'invoice automation software' with practical examples.",
        },
      },
      {
        input: {
          task: "Improve this draft intro and tighten headings for clarity.",
          draftId: "00000000-0000-0000-0000-000000000000",
        },
      },
    ],
    execute: async ({ task, draftId }) => {
      const prompt = draftId ? `${task}\n\nDraft ID to edit: ${draftId}` : task;

      const result = await writerAgent.generate({
        prompt,
      });
      const telemetry = summarizeAgentInvocation(result.steps);
      console.log("[orchestrator] write subagent completed", telemetry);

      return {
        content: result.text,
        telemetry,
      };
    },
    toModelOutput: ({ output }) => ({
      type: "content",
      value: [
        {
          type: "text" as const,
          text: [
            "Writer result:",
            `- steps: ${output.telemetry.stepCount}`,
            `- tool calls: ${output.telemetry.toolCallCount}`,
            output.telemetry.estimatedCostUsd != null
              ? `- est. cost (USD): ${output.telemetry.estimatedCostUsd}`
              : "- est. cost (USD): unavailable",
            `- content preview: ${output.content.slice(0, 1_500)}`,
          ].join("\n"),
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
