/**
 * Evaluator-optimizer pattern for content review.
 *
 * Uses a separate model (Gemini) to evaluate article quality against
 * a structured rubric. Returns actionable feedback the writer can
 * use to revise content.
 *
 * This can be used in two ways:
 * 1. Inline: Called within the writer's review phase (steps 31-35)
 * 2. External: Called as a separate workflow step in background mode (M3)
 */
import { google } from "@ai-sdk/google";
import { generateText, jsonSchema, Output } from "ai";

export interface ReviewResult {
  /** Overall quality score (1-10). */
  overallScore: number;
  /** Whether the article passes the quality bar (score >= 7). */
  passes: boolean;
  /** Structured feedback by category. */
  feedback: {
    seo: string;
    readability: string;
    accuracy: string;
    structure: string;
    brandVoice: string;
  };
  /** Specific actionable revisions to make. */
  revisions: string[];
  /** Raw reviewer output for debugging. */
  rawOutput: string;
}

function countWords(markdown: string): number {
  return markdown
    .replace(/[#*_`~[\]()>|!-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

/**
 * Evaluate an article against the quality rubric.
 *
 * Uses Gemini for cost-effective, fast evaluation with a structured rubric.
 * Returns actionable feedback the writer agent can use.
 */
export async function reviewArticle(input: {
  /** The article content to review (Markdown). */
  article: string;
  /** The primary keyword the article should target. */
  primaryKeyword: string;
  /** The website URL for context. */
  websiteUrl: string;
  /** Brand voice guidelines (if any). */
  brandVoice?: string | null;
  /** Custom writing instructions (if any). */
  customInstructions?: string | null;
  /** Planned target word count (if known). */
  targetWordCount?: number | null;
}): Promise<ReviewResult> {
  const prompt = `You are a senior editorial reviewer evaluating an SEO article. Review the article against the rubric below and provide structured feedback.

<article>
${input.article}
</article>

<context>
- Primary keyword: ${input.primaryKeyword}
- Website: ${input.websiteUrl}
${input.targetWordCount ? `- Target word count: ${input.targetWordCount}` : ""}
${input.brandVoice ? `- Brand voice: ${input.brandVoice}` : ""}
${input.customInstructions ? `- Custom instructions: ${input.customInstructions}` : ""}
</context>

<rubric>
Score each category 1-10 and provide specific feedback:

1. **SEO** (weight: 25%): Primary keyword in opening paragraph and key headings? Semantic variations used? 2-4 inline citations to authoritative external sources embedded naturally within claims (not standalone "Source:" lines)? Every statistic has an inline citation? 5-10 internal links with descriptive anchor text? If this article is part of a content cluster, does it link to the pillar page and at least 2 sibling pages?

2. **Readability** (weight: 25%): Clear opening hook? Direct, concise headings (no parenthetical explanations)? Proper use of lists/tables for scannability? Clean Markdown formatting? No thematic breaks or HTML line breaks? Does the article avoid obvious verbosity/filler?

3. **Accuracy** (weight: 20%): Statistics match cited sources exactly? No invented or unverified claims? Inline citations support the specific claims they're attached to (check that the linked URL is plausibly authoritative for the claim)? No marketing language presented as evidence? No placeholder or obviously fabricated URLs?

4. **Structure** (weight: 20%): Follows the outline closely? Proper section hierarchy? Summary/conclusion section present (varied heading, not always "Conclusion")? FAQ section (if present) comes after conclusion? Images placed after section titles? If target word count is provided, does the draft stay reasonably close (roughly +/-15%)?

5. **Brand Voice** (weight: 10%): Matches the specified brand voice? Follows custom instructions? Authoritative editorial tone (not conversational assistant)?
</rubric>
Respond with concise, specific, actionable feedback for each category.`;

  try {
    const result = await generateText({
      model: google("gemini-3-flash-preview"),
      output: Output.object({
        schema: jsonSchema<{
          overallScore: number;
          categoryScores: {
            seo: number;
            readability: number;
            accuracy: number;
            structure: number;
            brandVoice: number;
          };
          feedback: {
            seo: string;
            readability: string;
            accuracy: string;
            structure: string;
            brandVoice: string;
          };
          revisions: string[];
        }>({
          type: "object",
          additionalProperties: false,
          required: ["overallScore", "categoryScores", "feedback", "revisions"],
          properties: {
            overallScore: { type: "number", minimum: 1, maximum: 10 },
            categoryScores: {
              type: "object",
              additionalProperties: false,
              required: [
                "seo",
                "readability",
                "accuracy",
                "structure",
                "brandVoice",
              ],
              properties: {
                seo: { type: "number", minimum: 1, maximum: 10 },
                readability: { type: "number", minimum: 1, maximum: 10 },
                accuracy: { type: "number", minimum: 1, maximum: 10 },
                structure: { type: "number", minimum: 1, maximum: 10 },
                brandVoice: { type: "number", minimum: 1, maximum: 10 },
              },
            },
            feedback: {
              type: "object",
              additionalProperties: false,
              required: [
                "seo",
                "readability",
                "accuracy",
                "structure",
                "brandVoice",
              ],
              properties: {
                seo: { type: "string" },
                readability: { type: "string" },
                accuracy: { type: "string" },
                structure: { type: "string" },
                brandVoice: { type: "string" },
              },
            },
            revisions: {
              type: "array",
              items: { type: "string" },
            },
          },
        }),
      }),
      prompt,
    });

    const targetWordCount = input.targetWordCount;
    const articleWordCount = countWords(input.article);
    let overallScore = result.output.overallScore;
    let passes = overallScore >= 7;

    const feedback = { ...result.output.feedback };
    const revisions = [...result.output.revisions];

    if (typeof targetWordCount === "number" && targetWordCount > 0) {
      const lowerBound = Math.max(200, Math.floor(targetWordCount * 0.85));
      const upperBound = Math.ceil(targetWordCount * 1.15);
      const withinRange =
        articleWordCount >= lowerBound && articleWordCount <= upperBound;

      if (!withinRange) {
        passes = false;
        overallScore = Math.min(overallScore, 6);
        feedback.structure = `${feedback.structure} Word count mismatch: ${articleWordCount} words (target range: ${lowerBound}-${upperBound} around ${targetWordCount}).`;
        revisions.push(
          `Adjust article length to ${lowerBound}-${upperBound} words (current: ${articleWordCount}, target: ${targetWordCount}). Remove low-value sections or expand missing depth without filler.`,
        );
      }
    }

    return {
      overallScore,
      passes,
      feedback,
      revisions,
      rawOutput: result.text || JSON.stringify(result.output),
    };
  } catch (error) {
    // If generation or schema validation fails, return a conservative result.
    console.error(
      "[review] Failed to generate structured review output:",
      error,
    );
    return {
      overallScore: 5,
      passes: false,
      feedback: {
        seo: "Review generation failed — manual review needed.",
        readability: "Review generation failed — manual review needed.",
        accuracy: "Review generation failed — manual review needed.",
        structure: "Review generation failed — manual review needed.",
        brandVoice: "Review generation failed — manual review needed.",
      },
      revisions: [
        "Review output could not be generated. Please review the article manually.",
      ],
      rawOutput: "",
    };
  }
}
