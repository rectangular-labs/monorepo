import type { LanguageModelUsage, StepResult, ToolSet } from "ai";

export interface AgentUsageSummary {
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  cachedInputTokens: number;
  totalTokens: number;
}

export interface AgentInvocationSummary {
  modelId: string | null;
  stepCount: number;
  toolCallCount: number;
  usage: AgentUsageSummary;
  estimatedCostUsd: number | null;
}

type TokenPricing = {
  inputPer1M: number;
  outputPer1M: number;
};

// Best-effort public pricing snapshots used for observability trends.
// Keep these in sync as providers/models change.
const PRICING_BY_MODEL_PREFIX: Record<string, TokenPricing> = {
  "gpt-5.2": {
    inputPer1M: 1.75,
    outputPer1M: 14,
  },
  "gemini-3-flash-preview": {
    inputPer1M: 0.5,
    outputPer1M: 3,
  },
};

function round(value: number, precision = 6): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

function resolvePricingForModel(modelId: string | null): TokenPricing | null {
  if (!modelId) {
    return null;
  }
  const matchingKey = Object.keys(PRICING_BY_MODEL_PREFIX).find((key) =>
    modelId.startsWith(key),
  );
  if (!matchingKey) {
    return null;
  }
  return PRICING_BY_MODEL_PREFIX[matchingKey] ?? null;
}

export function summarizeUsage(usage: LanguageModelUsage): AgentUsageSummary {
  return {
    inputTokens: usage.inputTokens ?? 0,
    outputTokens: usage.outputTokens ?? 0,
    reasoningTokens:
      usage.outputTokenDetails.reasoningTokens ?? usage.reasoningTokens ?? 0,
    cachedInputTokens:
      usage.inputTokenDetails.cacheReadTokens ?? usage.cachedInputTokens ?? 0,
    totalTokens: usage.totalTokens ?? 0,
  };
}

export function summarizeAgentStep<T extends ToolSet>(step: StepResult<T>) {
  const usage = summarizeUsage(step.usage);
  const toolNames = step.toolCalls.map((call) => call.toolName);
  const pricing = resolvePricingForModel(step.response.modelId ?? null);
  const estimatedCostUsd = pricing
    ? round(
        (usage.inputTokens / 1_000_000) * pricing.inputPer1M +
          (usage.outputTokens / 1_000_000) * pricing.outputPer1M,
      )
    : null;

  return {
    modelId: step.response.modelId ?? null,
    finishReason: step.finishReason,
    toolCallCount: toolNames.length,
    toolNames,
    usage,
    estimatedCostUsd,
  };
}

export function summarizeAgentInvocation<T extends ToolSet>(
  steps: StepResult<T>[],
): AgentInvocationSummary {
  const summary = steps.reduce(
    (acc, step) => {
      const stepUsage = summarizeUsage(step.usage);
      return {
        modelId: acc.modelId ?? step.response.modelId ?? null,
        stepCount: acc.stepCount + 1,
        toolCallCount: acc.toolCallCount + step.toolCalls.length,
        usage: {
          inputTokens: acc.usage.inputTokens + stepUsage.inputTokens,
          outputTokens: acc.usage.outputTokens + stepUsage.outputTokens,
          reasoningTokens:
            acc.usage.reasoningTokens + stepUsage.reasoningTokens,
          cachedInputTokens:
            acc.usage.cachedInputTokens + stepUsage.cachedInputTokens,
          totalTokens: acc.usage.totalTokens + stepUsage.totalTokens,
        },
      };
    },
    {
      modelId: null as string | null,
      stepCount: 0,
      toolCallCount: 0,
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        reasoningTokens: 0,
        cachedInputTokens: 0,
        totalTokens: 0,
      },
    },
  );

  const pricing = resolvePricingForModel(summary.modelId);
  return {
    ...summary,
    estimatedCostUsd: pricing
      ? round(
          (summary.usage.inputTokens / 1_000_000) * pricing.inputPer1M +
            (summary.usage.outputTokens / 1_000_000) * pricing.outputPer1M,
        )
      : null,
  };
}
