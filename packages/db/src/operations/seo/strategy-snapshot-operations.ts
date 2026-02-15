import type { KeywordSnapshot } from "@rectangular-labs/core/schemas/strategy-parsers";
import { safe } from "@rectangular-labs/result";
import type { DB, DBTransaction } from "../../client";
import { listContentDraftsWithLatestSnapshot } from "./content-operations";

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
  organizationId: string;
  projectId: string;
  strategyId: string;
}) {
  return await safe(async () => {
    const contentDraftsResult = await listContentDraftsWithLatestSnapshot({
      db: args.db,
      organizationId: args.organizationId,
      projectId: args.projectId,
      strategyId: args.strategyId,
    });
    if (!contentDraftsResult.ok) {
      throw contentDraftsResult.error;
    }

    const metricSnapshots = contentDraftsResult.value
      .map((draft) => draft.metricSnapshots[0] ?? null)
      .filter((snapshot) => snapshot !== null);

    if (metricSnapshots.length === 0) {
      return {
        snapshot: null,
        rows: [],
      };
    }

    const byKeyword = new Map<string, KeywordSnapshot>();

    for (const metricSnapshot of metricSnapshots) {
      for (const row of metricSnapshot.topKeywords) {
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

    const latestSnapshot = metricSnapshots.reduce<{
      id: string;
      takenAt: Date;
    } | null>((latest, metricSnapshot) => {
      const snapshot = metricSnapshot.snapshot;
      if (!snapshot) return latest;
      if (!latest || snapshot.takenAt > latest.takenAt) {
        return {
          id: snapshot.id,
          takenAt: snapshot.takenAt,
        };
      }
      return latest;
    }, null);

    return {
      snapshot: latestSnapshot,
      rows,
    };
  });
}
