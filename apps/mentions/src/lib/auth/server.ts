import { initAuthHandler } from "@rectangular-labs/auth";
import { createDb } from "@rectangular-labs/db";
import { serverEnv } from "../env";

export const authServerHandler = initAuthHandler(
  serverEnv().VITE_MENTIONS_URL,
  createDb(),
);
