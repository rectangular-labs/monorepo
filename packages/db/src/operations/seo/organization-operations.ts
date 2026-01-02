import { ok, safe } from "@rectangular-labs/result";
import { desc, eq } from "drizzle-orm";
import { type DB, schema } from "../../client";

export async function getMembersByOrganizationId(
  db: DB,
  organizationId: string,
) {
  const rows = await safe(() =>
    db.query.member.findMany({
      where: eq(schema.member.organizationId, organizationId),
      with: { user: true },
      orderBy: desc(schema.member.createdAt),
    }),
  );
  if (!rows.ok) {
    return rows;
  }
  return ok(rows.value);
}
