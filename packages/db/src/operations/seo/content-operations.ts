import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, eq, schema } from "../../client";
import type { seoContentUpdateSchema } from "../../schema/seo";

export async function updateContent(
  db: DB,
  values: typeof seoContentUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoContent)
      .set(values)
      .where(
        and(
          eq(schema.seoContent.id, values.id),
          eq(schema.seoContent.projectId, values.projectId),
          eq(schema.seoContent.organizationId, values.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updatedContent = result.value[0];
  if (!updatedContent) {
    return err(new Error("Failed to update content"));
  }
  return ok(updatedContent);
}
