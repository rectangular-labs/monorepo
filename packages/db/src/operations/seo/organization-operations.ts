import { eq, desc } from "drizzle-orm";
import { DB, schema } from "../../client";
import { ok, safe } from "@rectangular-labs/result";

export async function getMembersByOrganizationId(db: DB, organizationId: string) {
    const rows = await safe(() => db.query.member.findMany({
        where: eq(schema.member.organizationId, organizationId),
        with: { user: true },
        orderBy: desc(schema.member.createdAt),
      }));
      if (!rows.ok) {
        return rows;
      }
      return ok(rows.value);
}