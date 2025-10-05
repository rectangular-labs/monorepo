import { err, safe } from "@rectangular-labs/result";
import { type DB, eq, schema } from "../../client";
import { buildConflictUpdateColumns } from "../../schema/_helper";
import type {
  seoSearchKeywordInsertSchema,
  seoSearchKeywordUpdateSchema,
} from "../../schema/seo";

export async function upsertSearchKeyword(
  db: DB,
  values: (typeof seoSearchKeywordInsertSchema.infer)[],
) {
  const result = await safe(() =>
    db
      .insert(schema.seoSearchKeyword)
      .values(
        values.map((value) => ({
          ...value,
          normalizedPhrase: value.normalizedPhrase.trim().toLowerCase(),
        })),
      )
      .onConflictDoUpdate({
        target: [
          schema.seoSearchKeyword.normalizedPhrase,
          schema.seoSearchKeyword.location,
        ],
        set: buildConflictUpdateColumns(schema.seoSearchKeyword, [
          "keywordDifficulty",
          "cpcUsdCents",
          "searchVolume",
          "intent",
          "backlinkInfo",
          "serpFeatures",
          "serpResults",
        ]),
      })
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (result.value.length !== values.length) {
    return err(
      new Error(
        `Failed to upsert search keywords. ${result.value.length} of ${values.length} keywords upserted`,
      ),
    );
  }
  return result;
}

export function getSearchKeywordByPhrase(db: DB, phrase: string) {
  return safe(() =>
    db.query.seoSearchKeyword.findFirst({
      where: (table, { eq }) =>
        eq(table.normalizedPhrase, phrase.trim().toLowerCase()),
    }),
  );
}

export async function updateSearchKeyword(
  db: DB,
  values: typeof seoSearchKeywordUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoSearchKeyword)
      .set(values)
      .where(eq(schema.seoSearchKeyword.id, values.id))
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (!result.value) {
    return err(new Error("Failed to update search keyword"));
  }
  return result;
}
