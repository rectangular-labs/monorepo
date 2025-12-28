import {
  CAMPAIGN_DEFAULT_STATUS,
  CAMPAIGN_DEFAULT_TITLE,
} from "@rectangular-labs/core/schemas/content-campaign-parser";
import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, schema } from "../../client";

export async function createContentCampaign(
  db: DB,
  values: typeof schema.seoContentCampaign.$inferInsert,
) {
  const result = await safe(() =>
    db.insert(schema.seoContentCampaign).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const campaign = result.value[0];
  if (!campaign) {
    return err(new Error("Failed to create content campaign"));
  }
  return ok(campaign);
}

export async function getDefaultContentCampaign({
  db,
  projectId,
  organizationId,
  userId,
}: {
  db: DB;
  projectId: string;
  organizationId: string;
  userId: string;
}) {
  const existingCampaignResult = await safe(() =>
    db.query.seoContentCampaign.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.projectId, projectId),
          eq(table.organizationId, organizationId),
          eq(table.status, CAMPAIGN_DEFAULT_STATUS),
          eq(table.title, CAMPAIGN_DEFAULT_TITLE),
          eq(table.createdByUserId, userId),
        ),
    }),
  );

  return existingCampaignResult;
}

export async function getContentCampaignById({
  db,
  id,
  projectId,
  organizationId,
}: {
  db: DB;
  id: string;
  projectId: string;
  organizationId: string;
}) {
  return await safe(() =>
    db.query.seoContentCampaign.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.id, id),
          eq(table.projectId, projectId),
          eq(table.organizationId, organizationId),
        ),
    }),
  );
}

export async function updateContentCampaign({
  db,
  values,
}: {
  db: DB;
  values: typeof schema.seoContentCampaignUpdateSchema.infer;
}) {
  const result = await safe(() =>
    db
      .update(schema.seoContentCampaign)
      .set(values)
      .where(
        and(
          eq(schema.seoContentCampaign.id, values.id),
          eq(schema.seoContentCampaign.projectId, values.projectId),
          eq(schema.seoContentCampaign.organizationId, values.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }

  return ok(result.value[0]);
}

export async function deleteContentCampaign({
  db,
  id,
  projectId,
  organizationId,
}: {
  db: DB;
  id: string;
  projectId: string;
  organizationId: string;
}) {
  const result = await safe(() =>
    db
      .delete(schema.seoContentCampaign)
      .where(
        and(
          eq(schema.seoContentCampaign.id, id),
          eq(schema.seoContentCampaign.projectId, projectId),
          eq(schema.seoContentCampaign.organizationId, organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value[0]);
}
