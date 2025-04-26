import { type } from "arktype";

const clientSchema = {
  VITE_APP_URL: "string>1",
  VITE_AUTH_URL: "string>1",
} as const;

const ClientEnv = type(clientSchema);

export const parseClientEnv = (env: unknown) => {
  const result = ClientEnv(env);
  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }
  return result;
};
export type ClientEnv = typeof ClientEnv.infer;

const ServerEnv = type({
  "...": clientSchema,
  // delete all non-symbolic keys other than "onlyPreservedStringKey"
  "+": "delete",
  "[symbol]": "unknown",
  DATABASE_URL: "string>1",
  DISCORD_CLIENT_ID: "string>1",
  DISCORD_CLIENT_SECRET: "string>1",
  GITHUB_CLIENT_ID: "string>1",
  GITHUB_CLIENT_SECRET: "string>1",
});
export const parseServerEnv = (env: unknown) => {
  const result = ServerEnv(env);
  if (result instanceof type.errors) {
    throw new Error(result.summary);
  }
  return result;
};

export type ServerEnv = typeof ServerEnv.infer;
