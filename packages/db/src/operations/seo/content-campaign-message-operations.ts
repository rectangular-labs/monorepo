import { err, ok, safe } from "@rectangular-labs/result";
import type { UIMessage } from "ai";
import { type DB, schema } from "../../client";

export async function createContentCampaignMessage<T extends UIMessage>({
  db,
  organizationId,
  projectId,
  campaignId,
  userId,
  source,
  message,
}: {
  db: DB;
  organizationId: string;
  projectId: string;
  campaignId: string;
  message: T;
  userId: string | null;
  source: "user" | "assistant";
}) {
  const result = await safe(() =>
    db
      .insert(schema.seoContentCampaignMessageSchema)
      .values({
        organizationId,
        projectId,
        campaignId,
        userId,
        source,
        message,
      })
      .returning(),
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
    db.query.seoContentCampaignMessageSchema.findMany({
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
