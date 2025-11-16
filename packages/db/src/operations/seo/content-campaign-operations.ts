import { err, ok, safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";
import {
  CAMPAIGN_DEFAULT_STATUS,
  CAMPAIGN_DEFAULT_TITLE,
} from "../../schema-parsers/content-campaign-parser";

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
