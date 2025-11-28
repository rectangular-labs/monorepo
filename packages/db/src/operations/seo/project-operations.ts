import { ok, safe } from "@rectangular-labs/result";
import { and, eq } from "drizzle-orm";
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
      .where(
        and(
          eq(schema.seoProject.id, values.id),
          values.organizationId
            ? eq(schema.seoProject.organizationId, values.organizationId)
            : undefined,
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }

  return ok(result.value[0]);
}

export async function deleteSeoProject(
  db: DB,
  id: string,
  organizationId: string,
) {
  const result = await safe(() =>
    db
      .delete(schema.seoProject)
      .where(
        and(
          eq(schema.seoProject.id, id),
          eq(schema.seoProject.organizationId, organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value[0]);
}

export function getSeoProjectById(db: DB, id: string) {
  return safe(() =>
    db.query.seoProject.findFirst({
      where: (table, { eq }) => eq(table.id, id),
    }),
  );
}

export function getSeoProjectByIdentifierAndOrgId(
  db: DB,
  identifier: string,
  orgId: string,
) {
  return safe(() =>
    db.query.seoProject.findFirst({
      where: (table, { eq, and, or }) =>
        or(
          and(eq(table.id, identifier), eq(table.organizationId, orgId)),
          and(eq(table.slug, identifier), eq(table.organizationId, orgId)),
        ),
    }),
  );
}
