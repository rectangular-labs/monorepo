import type { KeywordSnapshot } from "@rectangular-labs/core/schemas/strategy-parsers";
import { safe } from "@rectangular-labs/result";
import type { DB, DBTransaction } from "../../client";

export async function listStrategySnapshotsInRange(args: {
  db: DB | DBTransaction;
  strategyId: string;
  months: number;
}) {
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - args.months);

  return await safe(() =>
    args.db.query.seoStrategySnapshot.findMany({
      columns: {
        id: true,
        takenAt: true,
        aggregate: true,
      },
      where: (table, { and, eq, gte, isNull }) =>
        and(
          eq(table.strategyId, args.strategyId),
          gte(table.takenAt, startDate),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { asc }) => [asc(fields.takenAt)],
    }),
  );
}

export async function getLatestStrategySnapshotWithContents(args: {
  db: DB | DBTransaction;
  strategyId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategySnapshot.findFirst({
      columns: {
        id: true,
        takenAt: true,
      },
      where: (table, { and, eq, isNull }) =>
        and(eq(table.strategyId, args.strategyId), isNull(table.deletedAt)),
      orderBy: (fields, { desc }) => [desc(fields.takenAt)],
      with: {
        contentSnapshots: {
          where: (table, { isNull }) => isNull(table.deletedAt),
          orderBy: (fields, { desc }) => [desc(fields.createdAt)],
          with: {
            contentDraft: {
              columns: {
                id: true,
                title: true,
                slug: true,
                primaryKeyword: true,
                status: true,
                role: true,
              },
            },
          },
        },
      },
    }),
  );
}

export async function listContentSnapshotInRange(args: {
  db: DB | DBTransaction;
  strategyId: string;
  contentDraftId: string;
  months?: number;
}) {
  const months = args.months ?? 3;
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - months);

  return await safe(() =>
    args.db.query.seoStrategySnapshot.findMany({
      columns: {
        id: true,
        takenAt: true,
      },
      where: (table, { and, eq, gte, isNull }) =>
        and(
          eq(table.strategyId, args.strategyId),
          gte(table.takenAt, startDate),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { asc }) => [asc(fields.takenAt)],
      with: {
        contentSnapshots: {
          where: (table, { and, eq, isNull }) =>
            and(
              eq(table.contentDraftId, args.contentDraftId),
              isNull(table.deletedAt),
            ),
          columns: {
            aggregate: true,
          },
          limit: 1,
        },
      },
    }),
  );
}

export async function aggregateLatestSnapshotKeywords(args: {
  db: DB | DBTransaction;
  strategyId: string;
}) {
  return await safe(async () => {
    const snapshotResult = await getLatestStrategySnapshotWithContents({
      db: args.db,
      strategyId: args.strategyId,
    });
    if (!snapshotResult.ok) {
      throw snapshotResult.error;
    }

    const snapshot = snapshotResult.value;
    if (!snapshot) {
      return {
        snapshot: null,
        rows: [],
      };
    }

    const byKeyword = new Map<string, KeywordSnapshot>();

    for (const contentSnapshot of snapshot.contentSnapshots) {
      for (const row of contentSnapshot.topKeywords) {
        const keyword = row.keyword.trim();
        if (!keyword) continue;
        const existing = byKeyword.get(keyword) ?? {
          keyword,
          clicks: 0,
          impressions: 0,
          position: 0,
        };
        existing.clicks += row.clicks;
        existing.impressions += row.impressions;
        existing.position += row.position * row.impressions;
        byKeyword.set(keyword, existing);
      }
    }

    const rows = Array.from(byKeyword.values()).map((row) => {
      const avgPosition =
        row.impressions > 0 ? row.position / row.impressions : 0;
      const ctr = row.impressions > 0 ? row.clicks / row.impressions : 0;
      return {
        keyword: row.keyword,
        clicks: row.clicks,
        impressions: row.impressions,
        avgPosition,
        ctr,
      };
    });

    return {
      snapshot: {
        id: snapshot.id,
        takenAt: snapshot.takenAt,
      },
      rows,
    };
  });
}
