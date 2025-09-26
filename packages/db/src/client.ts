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

let db: ReturnType<
  typeof drizzle<typeof schema, postgres.Sql<Record<string, never>>>
> | null = null;

export const createDb = () => {
  if (db) {
    return db;
  }
  const env = dbEnv();
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
  });
  db = drizzle(client, {
    schema,
    casing: "snake_case",
  });

  return db;
};

export type DB = ReturnType<typeof createDb>;
export type DBTransaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
