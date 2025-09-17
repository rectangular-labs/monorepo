import { type DBTransaction, schema } from "@rectangular-labs/db";
import { err, ok } from "@rectangular-labs/result";
import { getContext } from "../context-storage";

export async function upsertKeyword(keyword: string, tx?: DBTransaction) {
  const context = await getContext();
  const [noConflictKeyword] = await (tx ?? context.db)
    .insert(schema.smKeyword)
    .values({
      phrase: keyword,
    })
    .onConflictDoNothing({
      target: schema.smKeyword.phrase,
    })
    .returning();
  if (noConflictKeyword) {
    return ok(noConflictKeyword);
  }

  const existingKeyword = await (tx ?? context.db).query.smKeyword.findFirst({
    where: (table, { eq }) => eq(table.phrase, keyword),
  });
  if (!existingKeyword) {
    return err(new Error(`Keyword ${keyword} not found`));
  }
  return ok(existingKeyword);
}

export async function getKeywordIds(projectId: string) {
  const context = await getContext();
  const keywordIds = await context.db.query.smProjectKeyword.findMany({
    where: (table, { eq }) => eq(table.projectId, projectId),
    columns: {
      keywordId: true,
    },
  });
  return keywordIds.map(({ keywordId }) => keywordId);
}
