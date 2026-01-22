import { getContext } from "@rectangular-labs/api-core/lib/context-storage";
import type { DB } from "@rectangular-labs/db";
import { getProviderIntegration } from "@rectangular-labs/db/operations";
import { ok, safe } from "@rectangular-labs/result";

export async function getGscIntegrationForProject(params: {
  db: DB;
  projectId: string;
  organizationId: string;
}) {
  const integrationResult = await getProviderIntegration(params.db, {
    projectId: params.projectId,
    organizationId: params.organizationId,
    provider: "google-search-console",
    status: "active",
  });
  if (!integrationResult.ok) {
    return integrationResult;
  }
  const integration = integrationResult.value;
  if (!integration || !integration.account) {
    return ok(null);
  }

  const context = getContext();
  const accessTokenResult = await safe(() =>
    context.auth.api.getAccessToken({
      body: {
        accountId: integration.accountId,
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
