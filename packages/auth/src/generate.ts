/**
 * @fileoverview Better Auth CLI Configuration
 *
 * This file is used exclusively by the Better Auth CLI to generate database schemas.
 * DO NOT USE THIS FILE DIRECTLY IN YOUR APPLICATION.
 *
 * This configuration is consumed by the CLI command:
 * `pnpx @better-auth/cli generate --config generate.ts --output ../db/src/schema/auth-schema.ts`
 *
 * For actual authentication usage, import from "./server.ts" instead.
 */
import { type Auth, initAuthHandler } from "./server";

/**
 * CLI-only authentication configuration for schema generation.
 *
 * @warning This configuration is NOT intended for runtime use.
 * @warning Use the main auth configuration from "./server.ts" for your application.
 */

export const auth: Auth = initAuthHandler({
  baseURL: "",
  encryptionKey: "",
  db: {},
  fromEmail: "",
});
