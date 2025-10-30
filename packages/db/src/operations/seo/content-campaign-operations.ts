import { err, ok, safe } from "@rectangular-labs/result";
import { type DB, schema } from "../../client";

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
