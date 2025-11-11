import { openai } from "@ai-sdk/openai";
import type { schema } from "@rectangular-labs/db";
import { ok, type Result, safe } from "@rectangular-labs/result";
import { generateObject, type JSONSchema7, jsonSchema } from "ai";
import { type } from "arktype";

const outputSchema = type({
  primaryKeyword: "string",
  reasoning: "string",
});

/**
 * Use LLM to select the primary keyword from a cluster of keywords based on page content
 */
export async function selectPrimaryKeyword(args: {
  pageUrl: string;
  pageMarkdown: string;
  keywords: (typeof schema.seoSearchKeywordSelectSchema.infer & {
    currentPosition: number | null;
    estimatedSearchVolume: number | null;
  })[];
}): Promise<Result<typeof outputSchema.infer, Error>> {
  const keywordsTable = [
    "normalizedPhrase, Search Volume, Keyword Difficulty, Cost per click ( USD Cents), keyword intent, average backlinks, article current position, article estimated volume",
    ...args.keywords.map(
      (kw) =>
        `${kw.normalizedPhrase}, ${kw.searchVolume ?? "N/A"}, ${kw.keywordDifficulty ?? "N/A"}, ${kw.cpcUsdCents}, ${kw.intent}, ${kw.backlinkInfo?.averageBacklinkCount ?? "N/A"}, ${kw.currentPosition ?? "N/A"}, ${kw.estimatedSearchVolume ?? "N/A"}`,
    ),
  ].join("\n");

  const system = `You are an SEO expert selecting the PRIMARY keyword for a content improvement campaign. 

You will be provided the page URL, page content, and candidate keywords. 

## Task

1. Select the primary keyword  that best represents the page's main topic/intent
2. Has good search volume and opportunity (considering current position)
3. Aligns with the actual page content

Return the exact keyword string and your reasoning.`;

  const result = await safe(() =>
    generateObject({
      model: openai("gpt-5-mini"),
      schema: jsonSchema<typeof outputSchema.infer>(
        outputSchema.toJsonSchema() as JSONSchema7,
      ),
      system,
      prompt: `
## Page URL

${args.pageUrl}

## Page Content

${args.pageMarkdown}

## Candidate Keywords CSV

${keywordsTable}`,
    }),
  );

  if (!result.ok) {
    return result;
  }
  const { object } = result.value;

  return ok(object);
}
