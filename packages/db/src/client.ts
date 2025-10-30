import { neon } from "@neondatabase/serverless";
import { drizzle as neonDrizzle } from "drizzle-orm/neon-http";
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

export const createDb = () => {
  const env = dbEnv();
  if (process.env.NODE_ENV === "development") {
    const client = postgres(env.DATABASE_URL, {
      prepare: false,
    });
    const db = drizzle({ client, schema, casing: "snake_case" });
    return db;
  }
  const sql = neon(env.DATABASE_URL);
  const db = neonDrizzle({ client: sql, schema, casing: "snake_case" });
  return db;
};
export { uuidv7 } from "./schema/_helper";
export type DB = ReturnType<typeof createDb>;
export type DBTransaction = Parameters<Parameters<DB["transaction"]>[0]>[0];
