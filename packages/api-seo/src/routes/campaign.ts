import { ORPCError, type as orpcType } from "@orpc/server";
import { schema, sql } from "@rectangular-labs/db";
import {
  createContentCampaign,
  deleteContentCampaign,
  getDefaultContentCampaign,
  listContentCampaignMessages,
  updateContentCampaign,
} from "@rectangular-labs/db/operations";
import {
  CAMPAIGN_DEFAULT_TITLE,
  contentCampaignMessageMetadataSchema,
} from "@rectangular-labs/db/parsers";
import { validateUIMessages } from "ai";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import { getWorkspaceBlobUri } from "../lib/workspace";
import type { SeoChatMessage } from "../types";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationId: "string",
      projectId: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
      "status?": type("'draft'|'review'|'accepted'|'denied'|undefined"),
      "search?": "string|undefined",
    }),
  )
  .output(
    type({
      data: schema.seoContentCampaignSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const campaigns = await context.db.query.seoContentCampaign.findMany({
      where: (table, { eq, and, ne, lt }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, input.organizationId),
          ne(table.title, CAMPAIGN_DEFAULT_TITLE),
          input.cursor ? lt(table.id, input.cursor) : undefined,
          input.status ? eq(table.status, input.status) : undefined,
          // https://orm.drizzle.team/docs/guides/postgresql-full-text-search
          input.search
            ? sql`to_tsvector('english', ${table.title}) @@ websearch_to_tsquery('english', ${input.search})`
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
  .input(type({ id: "string", projectId: "string", organizationId: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .output(type({ campaign: schema.seoContentCampaignSelectSchema }))
  .handler(async ({ context, input }) => {
    const campaign = await context.db.query.seoContentCampaign.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.organization.id),
        ),
    });
    if (!campaign) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return { campaign };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.seoContentCampaignInsertSchema.merge(
      type({ organizationId: "string" }),
    ),
  )
  .output(schema.seoContentCampaignSelectSchema)
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const existingDefaultCampaignResult = await getDefaultContentCampaign({
      db: context.db,
      projectId: input.projectId,
      organizationId: context.session.activeOrganizationId,
      userId: context.user.id,
    });
    if (!existingDefaultCampaignResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get default campaign",
        cause: existingDefaultCampaignResult.error,
      });
    }
    if (existingDefaultCampaignResult.value) {
      return existingDefaultCampaignResult.value;
    }

    const createContentCampaignResult = await createContentCampaign(
      context.db,
      {
        projectId: input.projectId,
        organizationId: context.organization.id,
        createdByUserId: context.user.id,
        workspaceBlobUri: getWorkspaceBlobUri({
          orgId: context.organization.id,
          projectId: input.projectId,
          campaignId: undefined,
        }),
      },
    );
    if (!createContentCampaignResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create campaign",
        cause: createContentCampaignResult.error,
      });
    }

    return createContentCampaignResult.value;
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    schema.seoContentCampaignUpdateSchema.merge(
      type({ organizationId: "string" }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .output(schema.seoContentCampaignSelectSchema)
  .handler(async ({ context, input }) => {
    if (input.title === CAMPAIGN_DEFAULT_TITLE) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Title cannot be the default title",
      });
    }
    if (!input.title && !input.status && !input.workspaceBlobUri) {
      throw new ORPCError("BAD_REQUEST", {
        message: "At least one field must be provided",
      });
    }
    const updateContentCampaignResult = await updateContentCampaign({
      db: context.db,
      values: {
        id: input.id,
        projectId: input.projectId,
        organizationId: context.organization.id,
        title: input.title,
        status: input.status,
        workspaceBlobUri: input.workspaceBlobUri,
      },
    });
    if (!updateContentCampaignResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to update campaign",
        cause: updateContentCampaignResult.error,
      });
    }
    if (!updateContentCampaignResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return updateContentCampaignResult.value;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", projectId: "string" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const deleteContentCampaignResult = await deleteContentCampaign({
      db: context.db,
      id: input.id,
      projectId: input.projectId,
      organizationId: context.session.activeOrganizationId,
    });
    if (!deleteContentCampaignResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to delete campaign",
        cause: deleteContentCampaignResult.error,
      });
    }
    if (!deleteContentCampaignResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return { success: true } as const;
  });

const messages = withOrganizationIdBase
  .route({ method: "GET", path: "/{id}/messages" })
  .input(
    type({
      id: "string.uuid",
      projectId: "string.uuid",
      organizationId: "string",
      limit: "1<=number<=100 = 10",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .output(
    orpcType<{ data: SeoChatMessage[]; nextPageCursor: string | undefined }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const result = await listContentCampaignMessages({
      db: context.db,
      organizationId: context.organization.id,
      projectId: input.projectId,
      campaignId: input.id,
      limit: input.limit,
      cursor: input.cursor,
    });
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to list campaign messages",
        cause: result.error,
      });
    }
    const { data, nextPageCursor } = result.value;

    if (data.length === 0) {
      return { data: [], nextPageCursor };
    }
    // todo: maybe not validate / cache validation
    const uiMessageSchema = await validateUIMessages<SeoChatMessage>({
      messages: data.map((row) => {
        return {
          id: row.id,
          role: row.source,
          parts: row.message,
          metadata: {
            sentAt: row.createdAt.toISOString(),
            userId: row.userId,
          },
        };
      }),
      metadataSchema: contentCampaignMessageMetadataSchema,
    });
    return { data: uiMessageSchema, nextPageCursor };
  });

export default withOrganizationIdBase
  .prefix("/organization/{organizationId}/project/{projectId}/campaign")
  .router({ list, get, create, update, remove, messages });
