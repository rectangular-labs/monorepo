import { ORPCError } from "@orpc/client";
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
      data: schema.seoContentCampaignSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const campaigns = await context.db.query.seoContentCampaign.findMany({
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
      campaign: schema.seoContentCampaignSelectSchema.merge({
        clusters: schema.seoContentCampaignClusterSelectSchema.array(),
      }),
    }),
  )
  .handler(async ({ context, input }) => {
    const campaign = await context.db.query.seoContentCampaign.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
      with: {
        clusters: true,
      },
    });
    if (!campaign) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return { campaign };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      projectId: "string",
      keywordCategory: "string",
    }),
  )
  .output(schema.seoContentCampaignSelectSchema)
  .handler(async ({ context, input }) => {
    const [campaign] = await context.db
      .insert(schema.seoContentCampaign)
      .values({
        projectId: input.projectId,
        keywordCategory: input.keywordCategory,
        organizationId: context.session.activeOrganizationId,
      })
      .returning();
    if (!campaign) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create campaign",
      });
    }
    return campaign;
  });

export default withOrganizationIdBase
  .prefix("/project/{projectId}/campaign")
  .router({ create, get, list });
