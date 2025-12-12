import { type DBTransaction, schema } from "@rectangular-labs/db";
import { err, ok, safe } from "@rectangular-labs/result";
import { getContext } from "../../context";

export async function upsertProject(
  values: typeof schema.seoProjectInsertSchema.infer & {
    organizationId: string;
  },
  tx?: DBTransaction,
) {
  const db = tx ?? (await getContext()).db;
  const projectResult = await safe(() =>
    db
      .insert(schema.seoProject)
      .values({
        organizationId: values.organizationId,
        websiteUrl: values.websiteUrl,
      })
      .onConflictDoNothing({
        target: [
          schema.seoProject.organizationId,
          schema.seoProject.websiteUrl,
        ],
      })
      .returning(),
  );
  if (!projectResult.ok) {
    return projectResult;
  }
  const insertedProject = projectResult.value[0];
  if (insertedProject) {
    return ok(insertedProject);
  }
  const existingProject = await db.query.seoProject.findFirst({
    where: (table, { eq, and }) =>
      and(
        eq(table.organizationId, values.organizationId),
        eq(table.websiteUrl, values.websiteUrl),
      ),
  });
  if (!existingProject) {
    return err(new Error("Failed to create project"));
  }
  return ok(existingProject);
}
