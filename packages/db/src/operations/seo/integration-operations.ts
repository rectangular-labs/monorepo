import { err, ok, safe } from "@rectangular-labs/result";
import { and, eq } from "drizzle-orm";
import { type DB, schema } from "../../client";

export function getIntegration(
  db: DB,
  params: { id: string; projectId: string; organizationId: string },
) {
  return safe(() =>
    db.query.seoIntegration.findFirst({
      where: (table, { eq, and }) =>
        and(
          eq(table.id, params.id),
          eq(table.projectId, params.projectId),
          eq(table.organizationId, params.organizationId),
        ),
    }),
  );
}

export function listIntegrations(
  db: DB,
  params: { projectId: string; organizationId: string },
) {
  return safe(() =>
    db.query.seoIntegration.findMany({
      where: (table, { eq, and }) =>
        and(
          eq(table.organizationId, params.organizationId),
          eq(table.projectId, params.projectId),
        ),
      orderBy: (table, { desc }) => desc(table.updatedAt),
    }),
  );
}

export async function createIntegration(
  db: DB,
  values: typeof schema.seoIntegration.$inferInsert,
) {
  const result = await safe(() =>
    db.insert(schema.seoIntegration).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const created = result.value[0];
  if (!created) {
    return err(new Error("Failed to create integration"));
  }
  return ok(created);
}

export async function updateIntegration(
  db: DB,
  params: {
    id: string;
    organizationId?: string;
    projectId?: string;
    values: Partial<typeof schema.seoIntegration.$inferInsert>;
  },
) {
  const where = and(
    eq(schema.seoIntegration.id, params.id),
    params.organizationId
      ? eq(schema.seoIntegration.organizationId, params.organizationId)
      : undefined,
    params.projectId
      ? eq(schema.seoIntegration.projectId, params.projectId)
      : undefined,
  );

  const result = await safe(() =>
    db
      .update(schema.seoIntegration)
      .set(params.values)
      .where(where)
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const updated = result.value[0];
  if (!updated) {
    return err(new Error("Failed to update integration"));
  }
  return ok(updated);
}
