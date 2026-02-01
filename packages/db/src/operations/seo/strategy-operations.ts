import { err, ok, safe } from "@rectangular-labs/result";
import { and, type DB, type DBTransaction, eq, schema } from "../../client";
import type {
  seoStrategyInsertSchema,
  seoStrategyPhaseContentInsertSchema,
  seoStrategyPhaseInsertSchema,
  seoStrategyPhaseUpdateSchema,
  seoStrategyUpdateSchema,
} from "../../schema/seo";

export async function listStrategiesByProjectId(args: {
  db: DB | DBTransaction;
  projectId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategy.findMany({
      where: (table, { eq, isNull, and }) =>
        and(eq(table.projectId, args.projectId), isNull(table.deletedAt)),
      orderBy: (fields, { desc }) => [desc(fields.updatedAt)],
      with: {
        phases: {
          where: (table, { isNull }) => isNull(table.deletedAt),
          orderBy: (fields, { desc }) => [desc(fields.createdAt)],
        },
      },
    }),
  );
}

export async function getStrategyDetails(args: {
  db: DB | DBTransaction;
  projectId: string;
  strategyId: string;
}) {
  return await safe(() =>
    args.db.query.seoStrategy.findFirst({
      where: (table, { eq, isNull, and }) =>
        and(
          eq(table.projectId, args.projectId),
          eq(table.id, args.strategyId),
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
                    notes: false,
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
  values: (typeof seoStrategyInsertSchema.infer)[],
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
