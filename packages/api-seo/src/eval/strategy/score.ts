/**
 * Strategy evaluation scorer.
 *
 * Strategy quality is inherently subjective, so this is almost entirely
 * LLM-as-a-Judge (G-Eval pattern). Uses Gemini Flash to keep costs low.
 */
import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import type { EvalResult, ScoreDimension, StrategyFixture } from "../types";

// ---------------------------------------------------------------------------
// LLM-as-Judge
// ---------------------------------------------------------------------------

interface LlmJudgeResult {
  dimensions: {
    name: string;
    score: number;
    feedback: string;
  }[];
}

async function llmJudgeStrategy(args: {
  strategyOutput: string;
  fixture: StrategyFixture;
}): Promise<LlmJudgeResult> {
  const { strategyOutput, fixture } = args;

  const prompt = `You are a senior SEO strategist evaluating a strategy recommendation. Score the following strategy output on the dimensions below. For each dimension, provide a score (1-10) and specific feedback.

<strategy-output>
${strategyOutput}
</strategy-output>

<context>
- Site: ${fixture.input.site.name} (${fixture.input.site.websiteUrl})
- Industry: ${fixture.input.site.industry}
- Business background: ${fixture.input.site.businessBackground}
- Instructions given: ${fixture.input.instructions}
</context>

<dimensions>
1. **Keyword Cluster Coherence**: Are the suggested keywords logically grouped into coherent clusters/topics? Do the clusters support a clear topical authority strategy? Are there gaps in the keyword coverage?

2. **Search Intent Alignment**: Does the strategy correctly identify and align with the search intent behind each keyword/topic? Are the content types (blog post, landing page, guide) matched to the intent?

3. **Competitive Gap Identification**: Does the strategy identify specific gaps or opportunities relative to competitors? Is the competitive analysis grounded in data rather than generic advice?

4. **Prioritization Quality**: Is the sequencing of content and efforts logical? Are quick wins distinguished from long-term plays? Does it account for the site's current authority level?

5. **Actionability & Specificity**: Can a content team execute this strategy without further research? Are deliverables specific (exact keywords, content types, target URLs) rather than vague recommendations?

6. **Realistic Expectations**: Are the goals and timelines achievable given the site's current state? Does the strategy acknowledge constraints (budget, DA, competition) rather than promising unrealistic results?
</dimensions>

<output-format>
Respond with a JSON object only (no markdown code fences, no explanation):
{
  "dimensions": [
    { "name": "Keyword Cluster Coherence", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Search Intent Alignment", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Competitive Gap Identification", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Prioritization Quality", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Actionability & Specificity", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Realistic Expectations", "score": <1-10>, "feedback": "<specific feedback>" }
  ]
}
</output-format>`;

  const result = await generateText({
    model: google("gemini-3-flash-preview"),
    prompt,
  });

  try {
    const cleaned = result.text
      .replace(/^```json?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    return JSON.parse(cleaned) as LlmJudgeResult;
  } catch {
    console.error(
      "[eval] Failed to parse strategy LLM judge output:",
      result.text.slice(0, 500),
    );
    return {
      dimensions: [
        {
          name: "Keyword Cluster Coherence",
          score: 5,
          feedback: "Parse failed",
        },
        { name: "Search Intent Alignment", score: 5, feedback: "Parse failed" },
        {
          name: "Competitive Gap Identification",
          score: 5,
          feedback: "Parse failed",
        },
        { name: "Prioritization Quality", score: 5, feedback: "Parse failed" },
        {
          name: "Actionability & Specificity",
          score: 5,
          feedback: "Parse failed",
        },
        { name: "Realistic Expectations", score: 5, feedback: "Parse failed" },
      ],
    };
  }
}

// ---------------------------------------------------------------------------
// Pairwise comparison
// ---------------------------------------------------------------------------

async function pairwiseCompare(args: {
  current: string;
  reference: string;
  fixture: StrategyFixture;
}): Promise<{ winner: "current" | "reference" | "tie"; reasoning: string }> {
  const { current, reference, fixture } = args;

  const prompt = `You are comparing two SEO strategy recommendations for the same site. Determine which is better overall.

<context>
- Site: ${fixture.input.site.name} (${fixture.input.site.websiteUrl})
- Industry: ${fixture.input.site.industry}
- Instructions: ${fixture.input.instructions}
</context>

<version-a>
${current}
</version-a>

<version-b>
${reference}
</version-b>

Consider: keyword research depth, competitive analysis, prioritization, actionability, and realism.

Respond with JSON only (no markdown code fences):
{
  "winner": "a" | "b" | "tie",
  "reasoning": "<2-3 sentence explanation>"
}`;

  const result = await generateText({
    model: google("gemini-3-flash-preview"),
    prompt,
  });

  try {
    const cleaned = result.text
      .replace(/^```json?\s*/m, "")
      .replace(/\s*```\s*$/m, "")
      .trim();
    const parsed = JSON.parse(cleaned) as {
      winner: "a" | "b" | "tie";
      reasoning: string;
    };
    return {
      winner:
        parsed.winner === "a"
          ? "current"
          : parsed.winner === "b"
            ? "reference"
            : "tie",
      reasoning: parsed.reasoning,
    };
  } catch {
    return { winner: "tie", reasoning: "Failed to parse comparison result." };
  }
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

const DIMENSION_WEIGHTS: Record<string, number> = {
  "Keyword Cluster Coherence": 0.2,
  "Search Intent Alignment": 0.2,
  "Competitive Gap Identification": 0.15,
  "Prioritization Quality": 0.15,
  "Actionability & Specificity": 0.15,
  "Realistic Expectations": 0.15,
};

export async function scoreStrategy(args: {
  output: string;
  fixture: StrategyFixture;
  durationMs: number;
}): Promise<EvalResult<StrategyFixture>> {
  const { output, fixture, durationMs } = args;

  // Run LLM judge
  const llmResult = await llmJudgeStrategy({
    strategyOutput: output,
    fixture,
  });

  const dimensions: ScoreDimension[] = llmResult.dimensions.map((d) => ({
    name: d.name,
    score: d.score,
    weight: DIMENSION_WEIGHTS[d.name] ?? 0.15,
    feedback: d.feedback,
  }));

  // Weighted overall score
  const totalWeight = dimensions.reduce((sum, d) => sum + d.weight, 0);
  const overallScore =
    dimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;

  // Pairwise comparison against reference
  let pairwiseVsReference: EvalResult<StrategyFixture>["pairwiseVsReference"] =
    null;
  if (fixture.referenceOutput) {
    pairwiseVsReference = await pairwiseCompare({
      current: output,
      reference: fixture.referenceOutput,
      fixture,
    });
  }

  return {
    fixtureId: fixture.id,
    timestamp: new Date().toISOString(),
    output,
    dimensions,
    overallScore: Math.round(overallScore * 100) / 100,
    pairwiseVsReference,
    durationMs,
    fixture,
  };
}
