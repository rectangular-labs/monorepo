import { ORPCError } from "@orpc/server";
import { and, eq, schema } from "@rectangular-labs/db";
import { type } from "arktype";
import { withOrganizationIdBase } from "../context";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      projectId: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
      "status?": type("'draft'|'review'|'accepted'|'denied'|undefined"),
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
          input.status ? eq(table.status, input.status) : undefined,
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
  .input(type({ id: "string", projectId: "string" }))
  .output(type({ campaign: schema.seoContentCampaignSelectSchema }))
  .handler(async ({ context, input }) => {
    const campaign = await context.db.query.seoContentCampaign.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          eq(table.organizationId, context.session.activeOrganizationId),
        ),
    });
    if (!campaign) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return { campaign };
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(schema.seoContentCampaignInsertSchema)
  .output(schema.seoContentCampaignSelectSchema)
  .handler(async ({ context, input }) => {
    const [created] = await context.db
      .insert(schema.seoContentCampaign)
      .values({
        projectId: input.projectId,
        organizationId: context.session.activeOrganizationId,
        createdByUserId: context.user.id,
        workspaceBlobUri: input.workspaceBlobUri,
        ...(input.status ? { status: input.status } : {}),
      })
      .returning();
    if (!created) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to create campaign",
      });
    }
    return created;
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(schema.seoContentCampaignUpdateSchema)
  .output(schema.seoContentCampaignSelectSchema)
  .handler(async ({ context, input }) => {
    const [updated] = await context.db
      .update(schema.seoContentCampaign)
      .set({
        status: input.status,
        workspaceBlobUri: input.workspaceBlobUri,
      })
      .where(
        and(
          eq(schema.seoContentCampaign.id, input.id),
          eq(schema.seoContentCampaign.projectId, input.projectId),
          eq(
            schema.seoContentCampaign.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!updated) {
      throw new ORPCError("NOT_FOUND", { message: "Campaign not found" });
    }
    return updated;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", projectId: "string" }))
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const [row] = await context.db
      .delete(schema.seoContentCampaign)
      .where(
        and(
          eq(schema.seoContentCampaign.id, input.id),
          eq(schema.seoContentCampaign.projectId, input.projectId),
          eq(
            schema.seoContentCampaign.organizationId,
            context.session.activeOrganizationId,
          ),
        ),
      )
      .returning();
    if (!row) {
      throw new ORPCError("NOT_FOUND", {
        message: "No campaign found to delete.",
      });
    }
    return { success: true } as const;
  });

export default withOrganizationIdBase
  .prefix("/project/{projectId}/campaign")
  .router({ list, get, create, update, remove });
