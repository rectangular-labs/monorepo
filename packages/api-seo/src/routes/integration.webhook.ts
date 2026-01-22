import { ORPCError } from "@orpc/server";
import { decrypt } from "@orpc/server/helpers";
import { webhookAdapter } from "@rectangular-labs/core/integrations/adapters/webhook-adapter";
import {
  type WebhookCredentials,
  webhookCredentialsSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { type } from "arktype";
import { protectedBase } from "../context";
import { apiEnv } from "../env";
import { createSignature } from "../lib/create-signature";
import { validateIntegrationMiddleware } from "../lib/middleware/validate-integration";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";

const testIntegration = protectedBase
  .route({ method: "POST", path: "/{id}/test" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
    }),
  )
  .output(type({ success: "true" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationMiddleware, (input) => ({
    id: input.id,
    projectId: input.projectId,
  }))
  .handler(async ({ context }) => {
    const integration = context.integration;
    const config = integration.config;
    if (config.provider !== "webhook") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Integration provider is not webhook.",
      });
    }

    let credentials: WebhookCredentials | undefined;
    if (integration.encryptedCredentials) {
      try {
        const decryptedString = await decrypt(
          integration.encryptedCredentials,
          apiEnv().AUTH_SEO_ENCRYPTION_KEY,
        );
        if (!decryptedString) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to decrypt integration credentials.",
          });
        }
        const parsedCredentials = webhookCredentialsSchema(
          JSON.parse(decryptedString),
        );
        if (parsedCredentials instanceof type.errors) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: "Failed to parse integration credentials.",
          });
        }
        credentials = parsedCredentials;
      } catch (error) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message:
            error instanceof Error
              ? error.message
              : "Failed to decrypt integration credentials.",
        });
      }
    }

    const result = await webhookAdapter(createSignature).publish(
      config,
      {
        title: "Webhook Test",
        slug: "webhook-test",
        description: "Test payload for webhook integration.",
        primaryKeyword: "test",
        contentMarkdown: "This is a test payload.",
        publishedAt: new Date(),
        articleType: "other",
      },
      credentials,
    );
    if (!result.ok) {
      throw new ORPCError("BAD_GATEWAY", {
        message: result.error.message,
      });
    }

    return { success: true as const };
  });

export const webhook = protectedBase.prefix("/webhook").router({
  testIntegration,
});
