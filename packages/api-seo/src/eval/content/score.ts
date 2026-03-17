/**
 * Content evaluation scorer.
 *
 * Combines deterministic checks (keyword placement, word count, readability,
 * heading structure) with LLM-as-a-Judge (G-Eval pattern) for subjective
 * quality dimensions.
 *
 * The deterministic scorers run instantly. The LLM judge uses the same
 * Gemini Flash model used in the writer's review loop, keeping costs low.
 */
import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, Output } from "ai";
import { type } from "arktype";
import type { ContentFixture, EvalResult, ScoreDimension } from "../types";

// ---------------------------------------------------------------------------
// Deterministic scorers
// ---------------------------------------------------------------------------

function countWords(text: string): number {
  return text
    .replace(/[#*_`~[\]()>|!-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
}

function scoreWordCount(
  markdown: string,
  expectations: ContentFixture["expectations"],
): ScoreDimension {
  const words = countWords(markdown);
  const { minWordCount, maxWordCount } = expectations;

  let score: number;
  if (words >= minWordCount && words <= maxWordCount) {
    score = 10;
  } else if (words < minWordCount) {
    const ratio = words / minWordCount;
    score = Math.max(1, Math.round(ratio * 10));
  } else {
    // Over max -- mild penalty
    const overRatio = words / maxWordCount;
    score = Math.max(3, Math.round(10 / overRatio));
  }

  return {
    name: "Word Count",
    score,
    weight: 0.1,
    feedback: `${words} words (target: ${minWordCount}-${maxWordCount})`,
  };
}

function scoreKeywordPlacement(
  markdown: string,
  primaryKeyword: string,
  title: string,
): ScoreDimension {
  const kw = primaryKeyword.toLowerCase();
  const titleLower = title.toLowerCase();
  const firstParagraphLower = extractFirstParagraph(markdown).toLowerCase();
  const descriptionLower = extractDescription(markdown)?.toLowerCase() ?? "";

  const checks = {
    inTitle: false,
    inFirstParagraph: false,
    inDescription: false,
  };

  if (titleLower.includes(kw)) {
    checks.inTitle = true;
  }

  if (firstParagraphLower.includes(kw)) {
    checks.inFirstParagraph = true;
  }

  if (descriptionLower.includes(kw)) {
    checks.inDescription = true;
  }

  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.max(1, Math.round((passed / 3) * 10));

  const failedChecks = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    name: "Keyword Placement",
    score,
    weight: 0.1,
    feedback:
      failedChecks.length === 0
        ? "Primary keyword is present in title, first paragraph, and description."
        : `Missing: ${failedChecks.join(", ")}`,
  };
}

function scoreHeadingStructure(markdown: string): ScoreDimension {
  const lines = markdown.split("\n");
  const headings = lines.filter((l) => /^#{1,6}\s/.test(l));

  const checks = {
    hasH2: false,
    properHierarchy: true,
  };

  const h2Count = headings.filter((h) => /^##\s/.test(h)).length;

  checks.hasH2 = h2Count >= 1;

  // Check hierarchy: no jumps (H1 -> H3 without H2)
  let prevLevel = 0;
  for (const h of headings) {
    const match = h.match(/^(#{1,6})\s/);
    if (!match?.[1]) continue;
    const level = match[1].length;
    if (level > prevLevel + 1 && prevLevel > 0) {
      checks.properHierarchy = false;
      break;
    }
    prevLevel = level;
  }

  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.max(1, Math.round((passed / 2) * 10));

  const failedChecks = Object.entries(checks)
    .filter(([, v]) => !v)
    .map(([k]) => k);

  return {
    name: "Heading Structure",
    score,
    weight: 0.05,
    feedback:
      failedChecks.length === 0
        ? `${headings.length} headings, proper hierarchy`
        : `Issues: ${failedChecks.join(", ")}`,
  };
}

function extractFirstParagraph(markdown: string): string {
  const blocks = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter((block) => block.length > 0);

  for (const block of blocks) {
    if (/^#{1,6}\s/.test(block)) continue;
    if (/^[-*+]\s/.test(block)) continue;
    if (/^\d+\.\s/.test(block)) continue;
    if (/^>\s/.test(block)) continue;
    if (/^```/.test(block)) continue;
    if (/^\|/.test(block)) continue;
    return block;
  }

  return "";
}

function extractDescription(markdown: string): string | null {
  const frontmatterMatch = markdown.match(
    /^---\s*\n([\s\S]*?)\n---(?:\n|$)/,
  )?.[1];
  if (frontmatterMatch) {
    const frontmatterDescription = frontmatterMatch.match(
      /^\s*description:\s*(.+)$/im,
    )?.[1];
    if (frontmatterDescription) {
      return frontmatterDescription.trim().replace(/^["']|["']$/g, "");
    }
  }

  const inlineDescriptionMatch = markdown.match(
    /^\s*(meta\s+description|description)\s*:\s*(.+)$/im,
  )?.[2];

  if (inlineDescriptionMatch) {
    return inlineDescriptionMatch.trim().replace(/^["']|["']$/g, "");
  }

  return null;
}

function scoreReadability(markdown: string): ScoreDimension {
  // Strip markdown formatting for text analysis
  const text = markdown
    .replace(/^#{1,6}\s.*$/gm, "")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .trim();

  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim().length > 0);

  const avgSentenceLength =
    sentences.length > 0
      ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) /
        sentences.length
      : 0;

  const avgParagraphSentences =
    paragraphs.length > 0 ? sentences.length / paragraphs.length : 0;

  // Targets: avg sentence 12-20 words, avg paragraph 2-5 sentences
  let score = 10;
  if (avgSentenceLength > 25) score -= 3;
  else if (avgSentenceLength > 20) score -= 1;
  if (avgSentenceLength < 8) score -= 2;

  if (avgParagraphSentences > 6) score -= 2;
  else if (avgParagraphSentences > 5) score -= 1;

  score = Math.max(1, Math.min(10, score));

  return {
    name: "Readability",
    score,
    weight: 0.05,
    feedback: `Avg sentence: ${avgSentenceLength.toFixed(1)} words. Avg paragraph: ${avgParagraphSentences.toFixed(1)} sentences.`,
  };
}

// ---------------------------------------------------------------------------
// LLM-as-Judge (G-Eval pattern)
// ---------------------------------------------------------------------------

const llmJudgeResultSchema = type({
  dimensions: type({
    name: "string",
    score: "1 <= number <= 10",
    feedback: "string",
  }).array(),
});

type LlmJudgeResult = typeof llmJudgeResultSchema.infer;

async function llmJudgeContent(args: {
  article: string;
  fixture: ContentFixture;
}): Promise<LlmJudgeResult> {
  const { article, fixture } = args;

  const prompt = `You are a senior SEO content evaluator. Score the following article on the dimensions below. For each dimension, provide a score (1-10) and specific feedback.

<article>
${article}
</article>

<context>
- Primary keyword: ${fixture.input.primaryKeyword}
- Title: ${fixture.input.title}
- Article type: ${fixture.input.articleType}
- Target website: ${fixture.input.project.websiteUrl}
- Business: ${fixture.input.project.businessBackground}
- Brand voice: ${fixture.input.project.brandVoice}
- Custom instructions: ${fixture.input.project.customInstructions}
${fixture.input.notes ? `- Notes: ${fixture.input.notes}` : ""}
</context>

<dimensions>
Apply these writer standards while scoring all six dimensions:
- Information gain: each major section should add something beyond generic SERP summaries.
- Search-intent fit and concise delivery (no filler for arbitrary word count).
- GEO structure: clear direct answer early, descriptive H2/H3 structure, extractable formats (lists/tables/FAQ where appropriate), entity-rich language.
- E-E-A-T signals: specific claims, concrete details, acknowledgment of tradeoffs, credible sourcing.
- Primary keyword discipline: title, opening sentence/paragraph, and meta description should all align naturally.
- Follow project custom instructions (including CTA guidance when relevant).

1. **Content Depth & Expertise**: Demonstrates concrete expertise, non-generic analysis, and credible evidence.
2. **Natural Keyword Integration**: Uses primary keyword and semantic variants naturally without stuffing, while preserving readability.
3. **Coherence & Flow**: Reads smoothly with logical section sequencing and clear transitions.
4. **Brand Voice Adherence**: Matches brand voice and project custom instructions consistently.
5. **Actionability & Unique Value**: Gives specific next steps and tangible value, not abstract advice.
6. **Article Type Compliance**: Matches the required structure and conventions for ${fixture.input.articleType}.
</dimensions>

<output-format>
Respond with a JSON object only (no markdown code fences, no explanation):
{
  "dimensions": [
    { "name": "Content Depth & Expertise", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Natural Keyword Integration", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Coherence & Flow", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Brand Voice Adherence", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Actionability & Unique Value", "score": <1-10>, "feedback": "<specific feedback>" },
    { "name": "Article Type Compliance", "score": <1-10>, "feedback": "<specific feedback>" }
  ]
}
</output-format>`;

  const result = await generateText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({
      schema: llmJudgeResultSchema,
    }),
    prompt,
  });

  return result.output;
}

// ---------------------------------------------------------------------------
// Pairwise comparison
// ---------------------------------------------------------------------------

async function pairwiseCompare(args: {
  current: string;
  reference: string;
  fixture: ContentFixture;
}): Promise<{ winner: "current" | "reference" | "tie"; reasoning: string }> {
  const { current, reference, fixture } = args;

  const prompt = `You are comparing two versions of an SEO article. Determine which version is better overall.

<context>
- Primary keyword: ${fixture.input.primaryKeyword}
- Article type: ${fixture.input.articleType}
- Brand voice: ${fixture.input.project.brandVoice}
</context>

<version-a>
${current}
</version-a>

<version-b>
${reference}
</version-b>

Consider: content quality, SEO optimization, readability, brand voice adherence, and actionability.`;

  const result = await generateText({
    model: google("gemini-3-flash-preview"),
    output: Output.object({
      schema: jsonSchema<{
        winner: "a" | "b" | "tie";
        reasoning: string;
      }>({
        type: "object",
        additionalProperties: false,
        required: ["winner", "reasoning"],
        properties: {
          winner: {
            type: "string",
            enum: ["a", "b", "tie"],
          },
          reasoning: {
            type: "string",
          },
        },
      }),
    }),
    prompt,
  });

  const parsed = result.output;
  return {
    winner:
      parsed.winner === "a"
        ? "current"
        : parsed.winner === "b"
          ? "reference"
          : "tie",
    reasoning: parsed.reasoning,
  };
}

// ---------------------------------------------------------------------------
// Main scorer
// ---------------------------------------------------------------------------

/** LLM-judged dimension weights (must sum with deterministic weights to 1.0) */
const LLM_DIMENSION_WEIGHTS: Record<string, number> = {
  "Content Depth & Expertise": 0.2,
  "Natural Keyword Integration": 0.1,
  "Coherence & Flow": 0.1,
  "Brand Voice Adherence": 0.1,
  "Actionability & Unique Value": 0.1,
  "Article Type Compliance": 0.1,
};

export async function scoreContent(args: {
  output: string;
  fixture: ContentFixture;
  durationMs: number;
}): Promise<EvalResult<ContentFixture>> {
  const { output, fixture, durationMs } = args;

  // Run deterministic scorers
  const deterministicDimensions: ScoreDimension[] = [
    scoreWordCount(output, fixture.expectations),
    scoreKeywordPlacement(
      output,
      fixture.input.primaryKeyword,
      fixture.input.title,
    ),
    scoreHeadingStructure(output),
    scoreReadability(output),
  ];

  // Run LLM judge
  const llmResult = await llmJudgeContent({ article: output, fixture });

  const llmDimensions: ScoreDimension[] = llmResult.dimensions.map((d) => ({
    name: d.name,
    score: d.score,
    weight: LLM_DIMENSION_WEIGHTS[d.name] ?? 0.1,
    feedback: d.feedback,
  }));

  const allDimensions = [...deterministicDimensions, ...llmDimensions];

  // Weighted overall score
  const totalWeight = allDimensions.reduce((sum, d) => sum + d.weight, 0);
  const overallScore =
    allDimensions.reduce((sum, d) => sum + d.score * d.weight, 0) / totalWeight;

  // Pairwise comparison against reference
  let pairwiseVsReference: EvalResult<ContentFixture>["pairwiseVsReference"] =
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
    dimensions: allDimensions,
    overallScore: Math.round(overallScore * 100) / 100,
    pairwiseVsReference,
    durationMs,
    fixture,
  };
}
