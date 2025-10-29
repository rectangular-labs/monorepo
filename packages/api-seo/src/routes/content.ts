import { schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .output(
    type({
      data: schema.seoContentSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const campaigns = await context.db.query.seoContent.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: input.limit + 1,
    });
    const data = campaigns.slice(0, input.limit);
    const nextPageCursor =
      campaigns.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const overview = withOrganizationIdBase
  .route({ method: "GET", path: "/overview" })
  .input(
    type({
      projectId: "string",
    }),
  )
  .output(
    type({
      totalContent: "number",
      rankingPages: "number",
      avgKeywordDifficulty: "number",
      totalTraffic: "number",
    }),
  )
  .handler(async ({ context, input }) => {
    const allContent = await context.db.query.seoContent.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
      with: {
        searchKeywordsMap: {
          with: {
            searchKeyword: true,
          },
        },
      },
    });

    const totalContent = allContent.length;
    let rankingPages = 0;
    let totalKeywordDifficulty = 0;
    let keywordCount = 0;
    let totalTraffic = 0;

    for (const content of allContent) {
      let hasRanking = false;
      for (const keywordMap of content.searchKeywordsMap) {
        if (keywordMap.serpDetail?.current?.position) {
          hasRanking = true;
          // Estimate traffic based on search volume and position
          const searchVol = keywordMap.searchKeyword.searchVolume || 0;
          const position = keywordMap.serpDetail.current.position;
          // Simple CTR estimation: 30% for position 1, decreasing by 5% per position
          const ctr = Math.max(0, 0.3 - (position - 1) * 0.05);
          totalTraffic += searchVol * ctr;
        }
        if (keywordMap.searchKeyword.keywordDifficulty) {
          totalKeywordDifficulty += keywordMap.searchKeyword.keywordDifficulty;
          keywordCount++;
        }
      }
      if (hasRanking) rankingPages++;
    }

    return {
      totalContent,
      rankingPages,
      avgKeywordDifficulty:
        keywordCount > 0
          ? Math.round(totalKeywordDifficulty / keywordCount)
          : 0,
      totalTraffic: Math.round(totalTraffic),
    };
  });

export default withOrganizationIdBase
  .prefix("/project/{projectId}/content")
  .router({ list, overview });
