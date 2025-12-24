import { ok, safe } from "@rectangular-labs/result";
import type { DB } from "../../client";

export async function getSeoProjectAuthorsByProjectId(
  db: DB,
  projectId: string,
) {
  const result = await safe(() =>
    db.query.seoProjectAuthor.findMany({
      where: (table, { eq }) => eq(table.projectId, projectId),
    }),
  );
  if (!result.ok) {
    return result;
  }
  return ok(result.value);
}
