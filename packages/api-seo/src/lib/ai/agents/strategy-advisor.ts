import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { GscConfig } from "@rectangular-labs/core/schemas/integration-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import {
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
  ToolLoopAgent,
} from "ai";
import type { InitialContext } from "../../../types";
import { buildStrategyAdvisorInstructions } from "../instructions/strategy-advisor";
import { createDataAccessTools } from "../tools/data-access-tool";
import { createDataforseoTool } from "../tools/dataforseo-tool";
import { createGscTool } from "../tools/google-search-console-tool";
import { createInternalLinksTool } from "../tools/internal-links-tool";
import { createWebTools } from "../tools/web-tools";
import { summarizeAgentStep } from "../utils/agent-telemetry";
import { wrappedOpenAI } from "../utils/wrapped-language-model";

interface StrategyAdvisorAgentContext {
  db: DB;
  cacheKV: InitialContext["cacheKV"];
  project: typeof schema.seoProject.$inferSelect;
  gscProperty: {
    config: GscConfig;
    accessToken?: string | null;
  } | null;
  jsonSchema?: JSONSchema7;
}

function createStrategyAgentTools(ctx: StrategyAdvisorAgentContext) {
  // only include gsc tools if the user has connected their gsc
  const gscTools = ctx.gscProperty?.accessToken
    ? createGscTool({
        accessToken: ctx.gscProperty.accessToken,
        siteUrl: ctx.gscProperty.config.domain,
        siteType: ctx.gscProperty.config.propertyType,
      })
    : { tools: {} };
  const dataforseoTools = createDataforseoTool(ctx.project, ctx.cacheKV);
  const webTools = createWebTools(ctx.project, ctx.cacheKV);

  const internalLinksTools = createInternalLinksTool(ctx.project);

  const dataAccessTools = createDataAccessTools({
    db: ctx.db,
    organizationId: ctx.project.organizationId,
    projectId: ctx.project.id,
  });

  // Merge all tools
  const tools = {
    ...gscTools.tools,
    ...dataforseoTools.tools,
    ...webTools.tools,
    ...internalLinksTools.tools,
    ...dataAccessTools.tools,
  };

  return tools;
}

/**
 * Create a Strategy Advisor ToolLoopAgent with direct tool access.
 *
 * This agent has access to:
 * - Data tools (GSC, DataForSEO, strategy details, analysis agent)
 * - Research tools (web search, web fetch)
 * - Creation tools (create article, images, internal links)
 * - Workspace tools (file, todo, settings, planner)
 *
 * Used as:
 * - Chat subagent: invoked by the orchestrator's `advise` tool
 * - Background agent: called directly by CF Workflows for phase generation,
 *   strategy suggestions, etc.
 *
 */
export function createStrategyAdvisorAgent<TOutput = never>(
  ctx: StrategyAdvisorAgentContext,
): {
  agent: ToolLoopAgent<
    never,
    ReturnType<typeof createStrategyAgentTools>,
    ReturnType<typeof Output.object<TOutput>>
  >;
} {
  const tools = createStrategyAgentTools(ctx);

  const instructions = buildStrategyAdvisorInstructions({
    project: ctx.project,
  });

  const output = ctx.jsonSchema
    ? Output.object({
        schema: jsonSchema<TOutput>(ctx.jsonSchema),
      })
    : undefined;

  const agent = new ToolLoopAgent({
    id: "strategy-advisor",
    model: wrappedOpenAI("gpt-5.2"),
    instructions,
    tools,
    output,
    stopWhen: stepCountIs(30),
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
      } satisfies OpenAIResponsesProviderOptions,
    },
    onStepFinish: (step) => {
      console.log("[strategy-advisor] step finished", summarizeAgentStep(step));
    },
  });

  return {
    agent,
  };
}
