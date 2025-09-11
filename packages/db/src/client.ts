import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { dbEnv } from "./env";
import * as authSchema from "./schema/auth-schema";
import * as mentionScheme from "./schema/mention";

export * from "drizzle-orm";

const mentionSchema = {
  ...authSchema,
  ...mentionScheme,
};

export const createDb = () => {
  const env = dbEnv();
  const client = postgres(env.DATABASE_URL, {
    prepare: false,
  });
  return drizzle(client, {
    schema: mentionSchema,
    casing: "snake_case",
  });
};

export type DB = ReturnType<typeof createDb>;
