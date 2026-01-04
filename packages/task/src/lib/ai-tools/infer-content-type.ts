import { openai } from "@ai-sdk/openai";
import { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";
import type { schema } from "@rectangular-labs/db";
import { ok, type Result, safe } from "@rectangular-labs/result";
import { generateObject, type JSONSchema7, jsonSchema } from "ai";
import { type } from "arktype";
import type { JinaSearchResult } from "../jina-ai";

const outputSchema = type({
  contentType: articleTypeSchema,
  reasoning: "string",
});

/**
 * Use LLM to infer the best content type based on SERP results
 */
export async function inferContentType(args: {
  keyword: typeof schema.seoSearchKeywordSelectSchema.infer;
  serpResults: JinaSearchResult[];
}): Promise<Result<typeof outputSchema.infer, Error>> {
  if (args.serpResults.length === 0) {
    return ok({
      contentType: "blog",
      reasoning: "No SERP results provided. Defaulting to blog.",
    });
  }

  const serpTable = [
    "Rank, Title, URL, Description",
    ...args.serpResults.map(
      (result, idx) =>
        `${idx + 1}, ${result.title}, ${result.url}, ${result.description}`,
    ),
  ].join("\n");

  const system = `You are an SEO expert analyzing SERP results to determine the best content format.

## Content Type Options:

- blog: Standard blog post format
- listicle: Numbered or bulleted list article (e.g., "Top 10...", "Best 5...")
- best-of-list: "Best/Top" rankings listicle with strict selection framing
- guide: Comprehensive tutorial or guide
- comparison: Comparison article (e.g., "X vs Y", "X or Y")
- how-to: Step-by-step instructional content
- checklist: Checklist format (e.g. "10 steps to X", "7 things you need to know about X")
- case-study: Real-world example or case study
- faq: FAQ-style article
- news: News update / announcement
- whitepaper: Long-form research / executive summary + methodology
- infographic: Visual-first asset with concise supporting copy
- press-release: Company press release format
- interview: Interview format
- product-update: Product update / release notes style
- contest-giveaway: Giveaway / contest announcement
- research-summary: Summary of research findings
- event-recap: Recap of an event
- best-practices: Best practices guide with checklist
- other: None of the above

## Task:

Analyze the SERP results and determine which content type dominates the top results. This will help us match user intent and compete effectively.

Return the content type and your reasoning.`;

  const result = await safe(() =>
    generateObject({
      model: openai("gpt-5-mini"),
      schema: jsonSchema<typeof outputSchema.infer>(
        outputSchema.toJsonSchema() as JSONSchema7,
      ),
      system,
      prompt: `
## Target Keyword details: 

phrase: ${args.keyword.normalizedPhrase}
search volume: ${args.keyword.searchVolume ?? "N/A"}
intent: ${args.keyword.intent}
cost per click (usd cents): ${args.keyword.cpcUsdCents}
backlink info: ${args.keyword.backlinkInfo?.averageBacklinkCount ?? "N/A"}
serp features: ${args.keyword.serpFeatures ?? "N/A"}

## Top 10 SERP Results CSV for keyword

${serpTable}
`,
    }),
  );

  if (!result.ok) {
    return result;
  }
  const { object } = result.value;

  return ok(object);
}
