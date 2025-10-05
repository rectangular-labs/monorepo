import { ORPCError } from "@orpc/client";
import { and, eq, schema } from "@rectangular-labs/db";
import { campaignTypeSchema } from "@rectangular-labs/db/parsers";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { createTask } from "../lib/task";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
      "campaignType?": campaignTypeSchema.or(type.undefined),
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
          input.campaignType
            ? eq(table.campaignType, input.campaignType)
            : undefined,
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: input.limit + 1,
    });
    const data = campaigns.slice(0, input.limit);
    const nextPageCursor =
      campaigns.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const get = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}" })
  .input(
    type({
      id: "string",
      projectId: "string",
    }),
  )
  .output(
    type({
      content: type({
        "...": schema.seoContentSelectSchema,
        searchKeywordsMap: type({
          "...": schema.seoContentSearchKeywordSelectSchema,
          searchKeyword: schema.seoSearchKeywordSelectSchema,
        }).array(),
      }),
    }),
  )
  .handler(async ({ context, input }) => {
    const content = await context.db.query.seoContent.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
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
    if (!content) {
      throw new ORPCError("NOT_FOUND", { message: "Content not found" });
    }
    return { content };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      projectId: "string",
      pathname: "string",
      contentCategory: "'money-page'|'authority-builder'|'quick-win'",
      campaignType: "'do-nothing'|'improvement'|'new-content'",
    }),
  )
  .output(schema.seoContentSelectSchema.merge(type({ taskId: "string" })))
  .handler(async ({ context, input }) => {
    const [campaign] = await context.db
      .insert(schema.seoContent)
      .values({
        projectId: input.projectId,
        pathname: input.pathname,
        contentCategory: input.contentCategory,
        campaignType: input.campaignType,
        organizationId: context.session.activeOrganizationId,
      })
      .returning();
    if (!campaign) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create campaign",
      });
    }
    const createTaskResult = await createTask({
      projectId: input.projectId,
      userId: context.user.id,
      input: {
        type: "analyze-keywords",
        projectId: input.projectId,
      },
    });
    if (!createTaskResult.ok) {
      throw createTaskResult.error;
    }
    return { ...campaign, taskId: createTaskResult.value.id };
  });

const updateFormat = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}/format" })
  .input(
    type({
      id: "string",
      projectId: "string",
      proposedFormat:
        "'blog'|'listicle'|'guide'|'comparison'|'how-to'|'checklist'|'case-study'|'other'",
    }),
  )
  .output(schema.seoContentSelectSchema)
  .handler(async ({ context, input }) => {
    const [updated] = await context.db
      .update(schema.seoContent)
      .set({ proposedFormat: input.proposedFormat })
      .where(
        and(
          eq(schema.seoContent.id, input.id),
          eq(schema.seoContent.projectId, input.projectId),
          eq(
            schema.seoContent.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Content not found" });
    }
    return updated;
  });

const saveVersion = withOrganizationIdBase
  .route({ method: "POST", path: "/{id}/version" })
  .input(
    type({
      id: "string",
      projectId: "string",
      title: "string",
      "description?": "string|undefined",
      markdown: "string",
    }),
  )
  .output(schema.seoContentSelectSchema)
  .handler(async ({ context, input }) => {
    const content = await context.db.query.seoContent.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
    });
    if (!content) {
      throw new ORPCError("NOT_FOUND", { message: "Content not found" });
    }
    const newVersion: {
      title: string;
      description?: string;
      markdown: string;
      createdAt: string;
    } = {
      title: input.title,
      ...(input.description ? { description: input.description } : {}),
      markdown: input.markdown,
      createdAt: new Date().toISOString(),
    };
    const updatedVersions = [...(content.markdownVersions || []), newVersion];
    const [updated] = await context.db
      .update(schema.seoContent)
      .set({ markdownVersions: updatedVersions })
      .where(eq(schema.seoContent.id, input.id))
      .returning();
    if (!updated) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to save version",
      });
    }
    return updated;
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
  .prefix("/project/{projectId}/campaign")
  .router({ create, get, list, updateFormat, saveVersion, overview });
