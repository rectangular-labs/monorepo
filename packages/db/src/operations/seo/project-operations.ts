import { eq } from "drizzle-orm";
import { type DB, schema } from "../../client";
import type { seoProjectUpdateSchema } from "../../schema/seo";

export function updateSeoProject(
  db: DB,
  values: typeof seoProjectUpdateSchema.infer,
) {
  return db
    .update(schema.seoProject)
    .set(values)
    .where(eq(schema.seoProject.id, values.id))
    .returning();
}

export function getSeoProjectById(db: DB, id: string) {
  return db.query.seoProject.findFirst({
    where: (table, { eq }) => eq(table.id, id),
  });
}
