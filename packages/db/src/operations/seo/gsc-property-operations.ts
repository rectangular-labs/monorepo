import { err, ok, safe } from "@rectangular-labs/result";
import { eq } from "drizzle-orm";
import { type DB, schema } from "../../client";
import { buildConflictUpdateColumns } from "../../schema/_helper";
import type { seoGscPropertyInsertSchema } from "../../schema/seo";

export async function upsertGscProperty(
  db: DB,
  values: typeof seoGscPropertyInsertSchema.infer,
) {
  const result = await safe(() =>
    db
      .insert(schema.seoGscProperty)
      .values(values)
      .onConflictDoUpdate({
        target: [schema.seoGscProperty.domain, schema.seoGscProperty.accountId],
        set: buildConflictUpdateColumns(schema.seoGscProperty, [
          "permissionLevel",
          "type",
        ]),
      })
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const returnValue = result.value[0];
  if (!returnValue) {
    return err(new Error("Failed to create GSC property"));
  }
  return ok(returnValue);
}

export async function connectGscPropertyToProject(
  db: DB,
  projectId: string,
  gscPropertyId: string,
) {
  const result = await safe(() =>
    db
      .update(schema.seoProject)
      .set({ gscPropertyId })
      .where(eq(schema.seoProject.id, projectId))
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const returnValue = result.value[0];
  if (!returnValue) {
    return err(new Error("Failed to connect GSC property to project"));
  }
  return ok(returnValue);
}

export async function disconnectGscPropertyFromProject(
  db: DB,
  projectId: string,
) {
  const result = await safe(() =>
    db
      .update(schema.seoProject)
      .set({ gscPropertyId: null })
      .where(eq(schema.seoProject.id, projectId))
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const returnValue = result.value[0];
  if (!returnValue) {
    return err(new Error("Failed to disconnect GSC property from project"));
  }
  return ok(returnValue);
}
