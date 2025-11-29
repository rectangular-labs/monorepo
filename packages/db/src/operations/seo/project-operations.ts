import { ok, safe } from "@rectangular-labs/result";
import { type } from "arktype";
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
  const isUrl = type("string.url")(identifier) instanceof type.errors === false;
  const isSlug =
    type("string.uuid")(identifier) instanceof type.errors === true;
  const check = (table: (typeof schema.seoProject)["_"]["columns"]) => {
    if (isUrl) {
      return eq(table.websiteUrl, identifier);
    }
    if (isSlug) {
      return eq(table.slug, identifier);
    }
    return eq(table.id, identifier);
  };

  return safe(() =>
    db.query.seoProject.findFirst({
      where: (table, { eq, and }) =>
        and(check(table), eq(table.organizationId, orgId)),
    }),
  );
}
