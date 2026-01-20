import { createHmac } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { decrypt } from "@orpc/server/helpers";
import { webhookAdapter } from "@rectangular-labs/core/integrations/adapters/webhook-adapter";
import {
  type WebhookCredentials,
  webhookCredentialsSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { getIntegration } from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { apiEnv } from "../env";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

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
  .handler(async ({ context, input }) => {
    const integration = await getIntegration(context.db, {
      id: input.id,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!integration.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: integration.error.message,
      });
    }
    if (!integration.value) {
      throw new ORPCError("NOT_FOUND", { message: "Integration not found." });
    }

    const config = integration.value.config;
    if (config.provider !== "webhook") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Integration provider is not webhook.",
      });
    }

    let credentials: WebhookCredentials | undefined;
    if (integration.value.encryptedCredentials) {
      try {
        const decryptedString = await decrypt(
          integration.value.encryptedCredentials,
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

    const result = await webhookAdapter((payload, secret) =>
      createHmac("sha256", secret).update(payload).digest("hex"),
    ).publish(
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
