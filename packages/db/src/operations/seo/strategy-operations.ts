import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, type DBTransaction, eq, schema } from "../../client";
import type {
  seoStrategyPhaseContentInsertSchema,
  seoStrategyPhaseInsertSchema,
  seoStrategyPhaseUpdateSchema,
  seoStrategySnapshotInsertSchema,
  seoStrategyUpdateSchema,
} from "../../schema/seo";

export async function listStrategiesByProjectId(args: {
  db: DB;
  projectId: string;
  organizationId: string;
}) {
  return await safe(() => {
    return args.db.query.seoStrategy.findMany({
      where: (table, { eq, isNull, and }) =>
        and(
          eq(table.projectId, args.projectId),
          eq(table.organizationId, args.organizationId),
          isNull(table.deletedAt),
        ),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
      with: {
        // fetches the latest phase that's "active"
        phases: {
          where: (table, { isNull, and, ne }) =>
            and(
              isNull(table.deletedAt),
              ne(table.status, "dismissed"),
              ne(table.status, "suggestion"),
            ),
          orderBy: (fields, { desc }) => [desc(fields.createdAt)],
          limit: 1,
        },
        snapshots: {
          columns: { aggregate: true },
          where: (table, { isNull }) => isNull(table.deletedAt),
          orderBy: (fields, { desc }) => [desc(fields.createdAt)],
          limit: 1,
        },
      },
    });
  });
}

export async function getStrategy(args: {
  db: DB;
  projectId: string;
  strategyId: string;
  organizationId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategy.findFirst({
      columns: { status: true },
      where: (table, { and, eq, isNull }) =>
        and(
          eq(table.id, args.strategyId),
          eq(table.projectId, args.projectId),
          eq(table.organizationId, args.organizationId),
          isNull(table.deletedAt),
        ),
    }),
  );
}

export async function getStrategyDetails(args: {
  db: DB | DBTransaction;
  projectId: string;
  strategyId: string;
  organizationId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategy.findFirst({
      where: (table, { eq, isNull, and }) =>
        and(
          eq(table.id, args.strategyId),
          eq(table.projectId, args.projectId),
          eq(table.organizationId, args.organizationId),
          isNull(table.deletedAt),
        ),
      with: {
        phases: {
          where: (table, { isNull }) => isNull(table.deletedAt),
          orderBy: (fields, { asc }) => [asc(fields.createdAt)],
          with: {
            phaseContents: {
              where: (table, { isNull }) => isNull(table.deletedAt),
              orderBy: (fields, { asc }) => [asc(fields.createdAt)],
              with: {
                contentDraft: {
                  columns: {
                    contentMarkdown: false,
                    outline: false,
                  },
                },
              },
            },
          },
        },
        snapshots: {
          where: (table, { isNull }) => isNull(table.deletedAt),
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
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
}

export async function createStrategies(
  db: DB | DBTransaction,
  values: (typeof schema.seoStrategy.$inferInsert)[],
) {
  if (values.length === 0) {
    return ok([]);
  }
  const result = await safe(() =>
    db.insert(schema.seoStrategy).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (result.value.length !== values.length) {
    return err(new Error("Failed to create strategy"));
  }
  return ok(result.value);
}

export async function updateStrategy(
  db: DB | DBTransaction,
  values: typeof seoStrategyUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoStrategy)
      .set(values)
      .where(
        and(
          eq(schema.seoStrategy.id, values.id),
          eq(schema.seoStrategy.projectId, values.projectId),
          eq(schema.seoStrategy.organizationId, values.organizationId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const strategy = result.value[0];
  if (!strategy) {
    return err(new Error("Failed to update strategy"));
  }
  return ok(strategy);
}

export async function createStrategyPhase(
  db: DB | DBTransaction,
  values: typeof seoStrategyPhaseInsertSchema.infer,
) {
  const result = await safe(() =>
    db.insert(schema.seoStrategyPhase).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const phase = result.value[0];
  if (!phase) {
    return err(new Error("Failed to create strategy phase"));
  }
  return ok(phase);
}

export async function createStrategyPhaseContent(
  db: DB | DBTransaction,
  values: typeof seoStrategyPhaseContentInsertSchema.infer,
) {
  const result = await safe(() =>
    db.insert(schema.seoStrategyPhaseContent).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const content = result.value[0];
  if (!content) {
    return err(new Error("Failed to create strategy phase content"));
  }
  return ok(content);
}

export async function updateStrategyPhase(
  db: DB | DBTransaction,
  values: typeof seoStrategyPhaseUpdateSchema.infer,
) {
  const result = await safe(() =>
    db
      .update(schema.seoStrategyPhase)
      .set(values)
      .where(
        and(
          eq(schema.seoStrategyPhase.id, values.id),
          eq(schema.seoStrategyPhase.strategyId, values.strategyId),
        ),
      )
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  const phase = result.value[0];
  if (!phase) {
    return err(new Error("Failed to update strategy phase"));
  }
  return ok(phase);
}

export async function getCurrentStrategyPhase(args: {
  db: DB;
  strategyId: string;
}) {
  const result = await safe(() =>
    args.db.query.seoStrategyPhase.findFirst({
      where: (table, { eq, isNull, and, ne }) =>
        and(
          eq(table.strategyId, args.strategyId),
          isNull(table.deletedAt),
          ne(table.status, "dismissed"),
          ne(table.status, "suggestion"),
        ),
      orderBy: (fields, { desc }) => [desc(fields.createdAt)],
    }),
  );
  if (!result.ok) {
    return result;
  }
  const phase = result.value;
  if (!phase) {
    return err(new Error("Failed to find strategy phase"));
  }
  return ok(phase);
}

export async function getLatestStrategySnapshot(args: {
  db: DB;
  strategyId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategySnapshot.findFirst({
      where: (table, { and, eq, isNull }) =>
        and(eq(table.strategyId, args.strategyId), isNull(table.deletedAt)),
      orderBy: (fields, { desc }) => [desc(fields.takenAt)],
    }),
  );
}

export async function createStrategySnapshot(
  db: DB | DBTransaction,
  values: typeof seoStrategySnapshotInsertSchema.infer,
) {
  const result = await safe(() =>
    db.insert(schema.seoStrategySnapshot).values(values).returning(),
  );
  if (!result.ok) {
    return result;
  }
  const snapshot = result.value[0];
  if (!snapshot) {
    return err(new Error("Failed to create strategy snapshot"));
  }
  return ok(snapshot);
}

export async function createStrategySnapshotContent(
  db: DB | DBTransaction,
  values:
    | typeof schema.seoStrategySnapshotContent.$inferInsert
    | (typeof schema.seoStrategySnapshotContent.$inferInsert)[],
) {
  const valuesArray = Array.isArray(values) ? values : [values];
  if (valuesArray.length === 0) {
    return ok([]);
  }
  const result = await safe(() =>
    db
      .insert(schema.seoStrategySnapshotContent)
      .values(valuesArray)
      .returning(),
  );
  if (!result.ok) {
    return result;
  }
  if (result.value.length !== valuesArray.length) {
    return err(new Error("Failed to create strategy snapshot contents"));
  }
  return ok(result.value);
}
