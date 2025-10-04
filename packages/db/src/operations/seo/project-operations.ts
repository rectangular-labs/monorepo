import { err, safe } from "@rectangular-labs/result";
import { eq } from "drizzle-orm";
import { type DB, schema } from "../../client";
import type { seoProjectUpdateSchema } from "../../schema/seo";

export async function updateSeoProject(
  db: DB,
  values: typeof seoProjectUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoProject)
      .set(values)
      .where(eq(schema.seoProject.id, values.id))
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (!result.value) {
    return err(new Error("Failed to update project"));
  }
  return result;
}

export function getSeoProjectById(db: DB, id: string) {
  return safe(() =>
    db.query.seoProject.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    }),
  );
}
