import type { Auth } from "@rectangular-labs/auth";
import type { DB } from "@rectangular-labs/db";
import { getProviderIntegration } from "@rectangular-labs/db/operations";
import { ok, safe } from "@rectangular-labs/result";
import { getContext } from "../../context";

export async function getGscIntegrationForProject(params: {
  db: DB;
  projectId: string;
  organizationId: string;
  authOverride?: Auth;
}) {
  const integrationResult = await getProviderIntegration(params.db, {
    projectId: params.projectId,
    organizationId: params.organizationId,
    provider: "google-search-console",
    status: "active",
    includeAccount: true,
  });
  if (!integrationResult.ok) {
    return integrationResult;
  }
  const integration = integrationResult.value;
  if (!integration || !integration.account) {
    return ok(null);
  }

  const context = params.authOverride
    ? { auth: params.authOverride }
    : getContext();
  const accessTokenResult = await safe(() =>
    context.auth.api.getAccessToken({
      body: {
        accountId: integration.accountId ?? undefined,
        userId: integration.account?.userId,
        providerId: "google",
      },
    }),
  );
  if (!accessTokenResult.ok) {
    return accessTokenResult;
  }
  if (integration.config.provider !== "google-search-console") {
    return ok(null);
  }

  return ok({
    ...integration,
    accountId: integration.account.id,
    config: integration.config,
    accessToken: accessTokenResult.value.accessToken,
  });
}
