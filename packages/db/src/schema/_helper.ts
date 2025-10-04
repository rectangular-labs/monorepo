import { getTableColumns, type SQL, sql } from "drizzle-orm";
import { type PgTable, timestamp } from "drizzle-orm/pg-core";
import { v7 } from "uuid";

export const timestamps = {
  createdAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp({ mode: "date", withTimezone: true })
    .notNull()
    .$onUpdateFn(() => new Date()),
};

export const uuidv7 = v7;

const camelToSnake = (str: string) =>
  str.replace(/([A-Z])/g, "_$1").toLowerCase();

// Helper function to build conflict update columns for upserts
export const buildConflictUpdateColumns = <
  T extends PgTable,
  Q extends keyof T["_"]["columns"],
>(
  table: T,
  columns: Q[],
) => {
  const cls = getTableColumns(table);

  return columns.reduce(
    (acc, column) => {
      const col = cls[column];
      if (col) {
        acc[column] = sql.raw(`excluded.${camelToSnake(col.name)}`);
      }
      return acc;
    },
    {} as Record<Q, SQL>,
  );
};
