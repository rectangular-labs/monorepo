import { err, ok, safe } from "@rectangular-labs/result";
import { type DB, eq, schema } from "../../client";
import type {
  seoContentSearchKeywordInsertSchema,
  seoContentUpdateSchema,
} from "../../schema/seo";

export async function addKeywordsToContent(
  db: DB,
  values: (typeof seoContentSearchKeywordInsertSchema.infer)[],
) {
  const result = await safe(() =>
    db.insert(schema.seoContentSearchKeyword).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (result.value.length !== values.length) {
    return err(
      new Error(
        `Failed to add keywords to content. ${result.value.length} of ${values.length} keywords added`,
      ),
    );
  }
  return result;
}

export async function updateContent(
  db: DB,
  values: typeof seoContentUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoContent)
      .set(values)
      .where(eq(schema.seoContent.id, values.id))
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

export function getContentWithKeywords(db: DB, contentId: string) {
  return safe(() =>
    db.query.seoContent.findFirst({
      where: (table, { eq }) => eq(table.id, contentId),
      with: {
        searchKeywordsMap: {
          with: {
            searchKeyword: true,
          },
        },
      },
    }),
  );
}
