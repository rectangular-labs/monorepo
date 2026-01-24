import { decrypt } from "@orpc/server/helpers";
import { getContext } from "@rectangular-labs/api-core/lib/context-storage";
import { githubAdapter } from "@rectangular-labs/core/integrations/adapters/github-adapter";
import { webhookAdapter } from "@rectangular-labs/core/integrations/adapters/webhook-adapter";
import {
  type ContentPayload,
  type IntegrationCredentials,
  integrationCredentialsSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import type { DB } from "@rectangular-labs/db";
import {
  getDefaultPublishingIntegrations,
  updateIntegration,
} from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { type } from "arktype";
import { apiEnv } from "../../env";
import { createSignature } from "../create-signature";

interface PublishContentParams {
  db: DB;
  organizationId: string;
  projectId: string;
  content: ContentPayload;
}

/**
 * Publishes content to all default publishing destinations (GitHub, Shopify, Webhook).
 * Fetches integrations, decrypts credentials, and calls the appropriate adapter for each destination.
 */
export async function publishToIntegrations(
  params: PublishContentParams,
): Promise<Result<{ publishedCount: number }>> {
  const context = getContext();
  const { db, projectId, content } = params;

  const destinationsResult = await getDefaultPublishingIntegrations(db, {
    projectId,
    organizationId: params.organizationId,
  });
  if (!destinationsResult.ok) {
    return err(
      new Error(
        `Failed to fetch publishing destinations: ${destinationsResult.error.message}`,
      ),
    );
  }
  const publishDestinations = destinationsResult.value;

  const publishResults = await Promise.allSettled(
    publishDestinations.map(async (destination) => {
      const config = destination.config;
      let credentials: IntegrationCredentials | undefined;
      if (destination.encryptedCredentials) {
        const decrypted = await decrypt(
          destination.encryptedCredentials,
          apiEnv().AUTH_SEO_ENCRYPTION_KEY,
        );
        if (!decrypted) {
          throw new Error("Failed to decrypt credentials.");
        }
        const parsedCredentials = integrationCredentialsSchema(
          JSON.parse(decrypted),
        );
        if (parsedCredentials instanceof type.errors) {
          return err(
            new Error(
              `Failed to parse credentials. ${parsedCredentials.summary}`,
            ),
          );
        }
        credentials = parsedCredentials;
      }

      switch (destination.provider) {
        case "github": {
          if (!destination.account || config.provider !== "github") {
            throw new Error("Invalid GitHub config.");
          }
          const { accessToken } = await context.auth.api.getAccessToken({
            body: {
              accountId: destination.account.id,
              userId: destination.account.userId,
              providerId: destination.account.providerId,
            },
          });
          return githubAdapter(accessToken).publish(config, content);
        }
        // case "shopify": {
        //   if (
        //     credentials?.provider !== "shopify" ||
        //     config.provider !== "shopify"
        //   ) {
        //     throw new Error("Invalid Shopify config.");
        //   }
        //   return shopifyAdapter().publish(config, content, credentials);
        // }
        case "webhook": {
          if (
            (credentials && credentials?.provider !== "webhook") ||
            config.provider !== "webhook"
          ) {
            throw new Error("Invalid webhook config.");
          }
          return webhookAdapter(createSignature).publish(
            config,
            content,
            credentials,
          );
        }
        default: {
          throw new Error(`Unsupported provider: ${destination.provider}`);
        }
      }
    }),
  );

  for (let i = 0; i < publishDestinations.length; i += 1) {
    const destination = publishDestinations[i];
    if (!destination) {
      return err(new Error("BAD STATE: destination is undefined"));
    }
    const result = publishResults[i];
    if (!result) {
      return err(new Error("BAD STATE: result is undefined"));
    }

    if (result.status === "fulfilled" && result.value.ok) {
      const updateResult = await updateIntegration(db, {
        id: destination.id,
        organizationId: destination.organizationId,
        projectId: destination.projectId,
        values: {
          status: "active",
          lastError: null,
          lastUsedAt: new Date(),
        },
      });
      if (!updateResult.ok) {
        console.error(
          "[publishContent] Failed to update integration status",
          updateResult.error,
        );
      }
    } else {
      const updateResult = await updateIntegration(db, {
        id: destination.id,
        organizationId: destination.organizationId,
        projectId: destination.projectId,
        values: {
          status: "error",
          lastError:
            result.status === "fulfilled"
              ? result.value.ok
                ? null
                : result.value.error
              : result.reason,
          lastUsedAt: null,
        },
      });
      if (!updateResult.ok) {
        console.error(
          "[publishContent] Failed to update integration status",
          updateResult.error,
        );
      }
    }
  }

  return ok({ publishedCount: publishDestinations.length });
}
