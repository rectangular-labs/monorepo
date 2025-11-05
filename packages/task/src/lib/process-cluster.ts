import type { DB, schema } from "@rectangular-labs/db";
import {
  addKeywordsToContent,
  updateSearchKeyword,
} from "@rectangular-labs/db/operations";
import { inferContentType } from "./ai-tools/infer-content-type.js";
import { selectPrimaryKeyword } from "./ai-tools/select-primary-keyword.js";
import { fetchPageAsMarkdown, fetchSerpResults } from "./jina-ai.js";

function _getContentCategory(
  keyword: typeof schema.seoSearchKeywordSelectSchema.infer,
) {
  return keyword.intent === "transactional"
    ? "money-page"
    : keyword.searchVolume && keyword.searchVolume > 5000
      ? "authority-builder"
      : "quick-win";
}

export const MAX_PAGE_RANK = 35;

/**
 * This functionProcess a single cluster (page URL + keywords) and create a campaign
 * * Fetch the page content as markdown using JINA.ai
 * * Format the keywords with the metrics + page markdown content and get a decision for primary keyword + secondary keywords from a LLM
 * * Fetch the top 10 serp data for the primary keyword from JINA.ai
 * * LLM Call to figure out the content type to target for (blog post, page, etc)
 * * Create a campaign with the primary keyword and secondary keywords
 * * We leave pages with keywords that have a first page ranking.
 */
export async function processCluster(args: {
  db: DB;
  project: typeof schema.seoProjectSelectSchema.infer;
  pageUrl: string;
  keywords: (typeof schema.seoSearchKeywordSelectSchema.infer & {
    currentPosition: number | null;
    estimatedSearchVolume: number | null;
  })[];
}): Promise<typeof schema.seoContentSelectSchema.infer | null> {
  const { db, pageUrl, keywords } = args;

  // Step 1: Fetch page content as markdown
  let pageMarkdown = "";
  const pageData = await fetchPageAsMarkdown(pageUrl);
  if (!pageData.ok) {
    console.error(
      `Failed to fetch page content for ${pageUrl}:`,
      pageData.error,
    );
    return null;
  }
  pageMarkdown = pageData.value.markdown;

  // Step 1.5: short circuit if the page keyword already ranks on page 1
  let bestKeyword = keywords[0];
  for (const kw of keywords) {
    if (
      kw.currentPosition &&
      kw.currentPosition < (bestKeyword?.currentPosition ?? 9999)
    ) {
      bestKeyword = kw;
    }
  }
  if (bestKeyword?.currentPosition && bestKeyword.currentPosition <= 10) {
    await addKeywordsToContent(
      db,
      keywords.map((kw) => ({
        contentId: "content.value.id",
        searchKeywordId: kw.id,
        type:
          kw.normalizedPhrase === bestKeyword.normalizedPhrase
            ? "primary"
            : "secondary",
        serpDetail: kw.currentPosition
          ? {
              current: {
                position: kw.currentPosition,
                date: new Date().toISOString(),
                estimatedTrafficVolume: kw.estimatedSearchVolume,
              },
              history: [],
            }
          : null,
      })),
    );

    return null;
  }

  // Step 2: Select primary keyword for content improvement
  const primaryKeywordResult = await selectPrimaryKeyword({
    pageUrl,
    pageMarkdown,
    keywords,
  });
  if (!primaryKeywordResult.ok) {
    console.error(
      `Failed to select primary keyword for ${pageUrl}:`,
      primaryKeywordResult.error,
    );
    return null;
  }
  const { primaryKeyword, reasoning: primaryKeywordReasoning } =
    primaryKeywordResult.value;
  console.log(
    `Selected primary keyword: "${primaryKeyword}" - ${primaryKeywordReasoning}`,
  );
  const primaryKeywordData = keywords.find(
    (kw) => kw.normalizedPhrase === primaryKeyword,
  );
  if (!primaryKeywordData) {
    console.error(`Primary keyword not found in keywords: ${primaryKeyword}`);
    return null;
  }

  // Step 3: Fetch SERP results for primary keyword
  const serpResults = await fetchSerpResults(primaryKeyword, { limit: 10 });
  if (!serpResults.ok) {
    console.error(
      `Failed to fetch SERP results for "${primaryKeyword}":`,
      serpResults.error,
    );
    return null;
  }
  await updateSearchKeyword(db, {
    id: primaryKeywordData.id,
    serpResults: serpResults.value,
  });

  // Step 4: Use LLM to infer content type from SERP
  const contentTypeResult = await inferContentType({
    keyword: primaryKeywordData,
    serpResults: serpResults.value,
  });
  if (!contentTypeResult.ok) {
    console.error(
      `Failed to infer content type for "${primaryKeyword}":`,
      contentTypeResult.error,
    );
    return null;
  }
  const { contentType, reasoning } = contentTypeResult.value;
  console.log({
    contentType,
    reasoning,
  });

  // Step 5: Calculate metrics and determine content category
  const totalSearchVolume = keywords.reduce(
    (sum, kw) => sum + (kw.searchVolume ?? 0),
    0,
  );
  const avgKeywordDifficulty =
    keywords.reduce((sum, kw) => sum + (kw.keywordDifficulty ?? 0), 0) /
    keywords.length;

  // Calculate impact score (simple formula)
  // Search volume / 100  40%
  // Keyword difficulty 30%
  // Intent 20%
  // Current position 10%
  const _impactScore =
    (totalSearchVolume / 100) * 0.4 +
    (100 - avgKeywordDifficulty) * 0.3 +
    (primaryKeywordData?.intent === "transactional"
      ? 100
      : primaryKeywordData?.intent === "commercial"
        ? 80
        : 60) *
      0.2 +
    (primaryKeywordData.currentPosition
      ? (MAX_PAGE_RANK - primaryKeywordData.currentPosition) * 0.1
      : 0);

  // Step 6: Create content

  await addKeywordsToContent(
    db,
    keywords.map((kw) => ({
      contentId: "content.value.id",
      searchKeywordId: kw.id,
      type: kw.normalizedPhrase === primaryKeyword ? "primary" : "secondary",
      serpDetail: kw.currentPosition
        ? {
            current: {
              position: kw.currentPosition,
              date: new Date().toISOString(),
              estimatedTrafficVolume: kw.estimatedSearchVolume,
            },
            history: [],
          }
        : null,
    })),
  );

  console.log(`Created campaign for ${pageUrl}`);

  return null;
}
