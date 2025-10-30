import { ORPCError } from "@orpc/server";
import { and, eq, schema, uuidv7 } from "@rectangular-labs/db";
import {
  createContentCampaign,
  getSeoProjectById,
  updateSeoProject,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { LoroDoc } from "loro-crdt";
import { withOrganizationIdBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import { createWorkspaceBlobUri } from "../lib/workspace";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationId: "string",
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
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const campaigns = await context.db.query.seoContentCampaign.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.projectId, input.projectId),
          eq(table.organizationId, input.organizationId),
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
  .input(type({ id: "string", projectId: "string", organizationId: "string" }))
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
  .input(
    schema.seoContentCampaignInsertSchema.merge(
      type({ organizationId: "string" }),
    ),
  )
  .output(schema.seoContentCampaignSelectSchema)
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const doc = new LoroDoc();
    const projectResult = await getSeoProjectById(context.db, input.projectId);
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error fetching project",
        cause: projectResult.error,
      });
    }
    if (!projectResult.value?.workspaceBlobUri) {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Project does not have a workspace. Please refresh the page and try again.",
      });
    }
    const { workspaceBlobUri } = projectResult.value;
    const workspaceBlob =
      await context.workspaceStorage.getSnapshot(workspaceBlobUri);
    if (!workspaceBlob) {
      await updateSeoProject(context.db, {
        id: input.projectId,
        organizationId: context.session.activeOrganizationId,
        workspaceBlobUri: null,
      });
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Project workspace not found. Please refresh the page and try again.",
      });
    }
    doc.import(workspaceBlob);
    const campaignId = uuidv7();
    const forkDoc = doc.fork();
    const forkBlobUri = createWorkspaceBlobUri({
      orgId: context.organization.id,
      projectId: input.projectId,
      campaignId,
    });
    await context.workspaceStorage.setItemRaw(
      forkBlobUri,
      // TODO: Shallow copy of main
      forkDoc.export({ mode: "snapshot" }),
    );
    const createContentCampaignResult = await createContentCampaign(
      context.db,
      {
        id: campaignId,
        projectId: input.projectId,
        organizationId: context.organization.id,
        createdByUserId: context.user.id,
        workspaceBlobUri: forkBlobUri,
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
  .prefix("/organization/{organizationId}/project/{projectId}/campaign")
  .router({ list, get, create, update, remove });
