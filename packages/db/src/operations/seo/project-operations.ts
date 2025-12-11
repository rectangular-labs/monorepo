import { err, ok, type Result, safe } from "@rectangular-labs/result";
import { type } from "arktype";
import { and, eq, notInArray } from "drizzle-orm";
import { type DB, schema } from "../../client";
import { buildConflictUpdateColumns } from "../../schema/_helper";
import type {
  seoProjectSelectSchema,
  seoProjectUpdateSchema,
} from "../../schema/seo";
import type {
  businessBackgroundSchema,
  imageSettingsSchema,
  serpTrafficSchema,
  writingSettingsSchema,
} from "../../schema-parsers";

export async function updateSeoProject(
  db: DB,
  values: typeof seoProjectUpdateSchema.infer & {
    articleSettings?: typeof writingSettingsSchema.infer;
  },
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

export async function getSeoProjectByIdentifierAndOrgId<
  B extends boolean = false,
  I extends boolean = false,
  A extends boolean = false,
  S extends boolean = false,
>(
  db: DB,
  identifier: string,
  orgId: string,
  includeSettings?: {
    businessBackground?: B;
    imageSettings?: I;
    articleSettings?: A;
    serpSnapshot?: S;
  },
): Promise<
  Result<
    | (Omit<
        typeof seoProjectSelectSchema.infer,
        | "businessBackground"
        | "imageSettings"
        | "articleSettings"
        | "serpSnapshot"
      > &
        (B extends true
          ? { businessBackground: typeof businessBackgroundSchema.infer }
          : Record<string, never>) &
        (I extends true
          ? { imageSettings: typeof imageSettingsSchema.infer }
          : Record<string, never>) &
        (A extends true
          ? { articleSettings: typeof writingSettingsSchema.infer }
          : Record<string, never>) &
        (S extends true
          ? { serpSnapshot: typeof serpTrafficSchema.infer }
          : Record<string, never>))
    | null,
    Error
  >
> {
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

  const result = await safe(() =>
    db.query.seoProject.findFirst({
      columns: {
        id: true,
        slug: true,
        name: true,
        websiteUrl: true,
        createdAt: true,
        updatedAt: true,
        gscPropertyId: true,
        workspaceBlobUri: true,
        organizationId: true,
        ...(includeSettings ?? {}),
      },
      where: (table, { eq, and }) =>
        and(check(table), eq(table.organizationId, orgId)),
    }),
  );
  if (!result.ok) {
    return result;
  }
  // biome-ignore lint/suspicious/noExplicitAny: type hacking
  return ok((result.value as any) ?? null);
}

export async function getSeoProjectWithWritingSettingAndAuthors(
  db: DB,
  projectSlug: string,
  organizationId: string,
) {
  const result = await safe(() =>
    db.query.seoProject.findFirst({
      columns: {
        id: true,
        writingSettings: true,
      },
      where: (table, { eq }) =>
        and(
          eq(table.slug, projectSlug),
          eq(table.organizationId, organizationId),
        ),
      with: {
        authors: true,
      },
    }),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value);
}

export async function upsertSeoProjectAuthors(
  db: DB,
  projectId: string,
  authors: (typeof schema.seoProjectAuthorInsertSchema.infer)[],
) {
  if (!authors.length) {
    return ok([]);
  }
  const result = await safe(() =>
    db
      .insert(schema.seoProjectAuthor)
      .values(
        authors.map((author) => ({
          ...author,
          projectId,
        })),
      )
      .onConflictDoUpdate({
        target: [
          schema.seoProjectAuthor.projectId,
          schema.seoProjectAuthor.name,
        ],
        set: buildConflictUpdateColumns(schema.seoProjectAuthor, [
          "bio",
          "avatarUri",
          "socialLinks",
          "title",
        ]),
      })
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (result.value.length !== authors.length) {
    return err(new Error("Failed to upsert all authors"));
  }
  return ok(result.value);
}

export async function deleteRemainingSeoProjectAuthors(
  db: DB,
  projectId: string,
  authorIdsToKeep: string[],
) {
  const result = await safe(() =>
    db
      .delete(schema.seoProjectAuthor)
      .where(
        and(
          eq(schema.seoProjectAuthor.projectId, projectId),
          notInArray(schema.seoProjectAuthor.id, authorIdsToKeep),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value);
}
