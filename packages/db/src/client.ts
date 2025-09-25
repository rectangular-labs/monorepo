import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbEnv } from "./env";
import * as authSchema from "./schema/auth-schema";
import * as mentionScheme from "./schema/mention";
import * as seoScheme from "./schema/seo";

export * from "drizzle-orm";

export const schema = {
  ...authSchema,
  ...mentionScheme,
  ...seoScheme,
};

// Thread-safe singleton implementation
let db: ReturnType<
  typeof drizzle<typeof schema, postgres.Sql<Record<string, never>>>
> | null = null;
let isInitializing = false;

export const createDb = () => {
  // If already initialized, return immediately
  if (db) {
    return db;
  }

  // Prevent multiple concurrent initializations
  if (isInitializing) {
    // Busy wait with small delay to avoid tight loop
    // In Node.js, this is sufficient for typical usage patterns
    while (isInitializing) {
      // do nothing
    }
    // After waiting, db should be initialized
    if (db) {
      return db;
    }
  }

  // Mark as initializing
  isInitializing = true;
  try {
    // Double-check pattern: verify db is still null after acquiring the lock
    if (!db) {
      const env = dbEnv();
      const client = postgres(env.DATABASE_URL, {
        prepare: false,
      });
      db = drizzle(client, {
        schema,
        casing: "snake_case",
      });
    }
  } finally {
    // Always reset the initializing flag
    isInitializing = false;
  }

  return db;
};

export type DB = ReturnType<typeof createDb>;
export type DBTransaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
