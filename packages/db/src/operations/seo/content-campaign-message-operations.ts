import { err, ok, safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";
import type { seoContentCampaignMessageInsertSchema } from "../../schema/seo";

export async function createContentCampaignMessage({
  db,
  value,
}: {
  db: DB;
  value: typeof seoContentCampaignMessageInsertSchema.infer;
}) {
  const result = await safe(() =>
    db.insert(schema.seoContentCampaignMessage).values(value).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const row = result.value[0];
  if (!row) {
    return err(new Error("Failed to create content campaign message"));
  }
  return ok(row);
}

export async function listContentCampaignMessages({
  db,
  organizationId,
  projectId,
  campaignId,
  limit = 10,
  cursor,
}: {
  db: DB;
  organizationId: string;
  projectId: string;
  campaignId: string;
  limit?: number;
  cursor?: string;
}) {
  const result = await safe(() =>
    db.query.seoContentCampaignMessage.findMany({
      where: (table, { and, eq, lt }) =>
        and(
          eq(table.organizationId, organizationId),
          eq(table.projectId, projectId),
          eq(table.campaignId, campaignId),
          cursor ? lt(table.id, cursor) : undefined,
        ),
      orderBy: (fields, { desc }) => [desc(fields.id)],
      limit: limit + 1,
    }),
  );
  if (!result.ok) {
    return result;
  }
  const rows = result.value;
  const data = rows.slice(0, limit);
  const nextPageCursor = rows.length > limit ? data.at(-1)?.id : undefined;
  return ok({ data, nextPageCursor });
}
