import { type Auth, initAuthHandler } from "@rectangular-labs/auth";
import type { DB } from "@rectangular-labs/db";
import { apiEnv } from "../../../env";

/**
 * Create an auth handler for use in workflows (outside request context).
 */
export function createWorkflowAuth(db: DB): Auth {
  const env = apiEnv();
  return initAuthHandler({
    baseURL: env.SEO_URL,
    db,
    encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
    fromEmail: env.AUTH_SEO_FROM_EMAIL,
    inboundApiKey: env.SEO_INBOUND_API_KEY,
    credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
    discordClientId: env.AUTH_SEO_DISCORD_ID,
    discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
    githubClientId: env.AUTH_SEO_GITHUB_ID,
    githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
    googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
    googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
  }) as Auth;
}
