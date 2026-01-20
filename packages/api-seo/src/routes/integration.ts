import { ORPCError, os } from "@orpc/server";
import { encrypt } from "@orpc/server/helpers";
import type { Session } from "@rectangular-labs/auth";
import {
  type IntegrationProvider,
  integrationCredentialsSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { and, type DB, eq, schema } from "@rectangular-labs/db";
import {
  createIntegration,
  getIntegration,
  listIntegrations,
  updateIntegration,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { apiEnv } from "../env";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import type { InitialContext } from "../types";
import { github } from "./integration.github";
import { shopify } from "./integration.shopify";
import { webhook } from "./integration.webhook";

const integrationSummarySchema = schema.seoIntegrationSelectSchema.pick(
  "id",
  "provider",
  "name",
  "status",
  "lastUsedAt",
  "lastError",
  "isDefault",
  "updatedAt",
);

function getProviderId(provider: IntegrationProvider) {
  if (provider === "github") return "github";
  if (provider === "google-search-console") return "google";
  return null;
}

function getRequiredScope(provider: IntegrationProvider) {
  if (provider === "github") return "repo";
  if (provider === "google-search-console") return "webmasters";
  return null;
}

async function assertAccountConnected(params: {
  accountId: string;
  provider: IntegrationProvider;
  userId: string;
  db: DB;
}) {
  const providerId = getProviderId(params.provider);
  if (!providerId) {
    throw new ORPCError("BAD_REQUEST", {
      message: "Provider Account not supported.",
    });
  }

  const account = await params.db.query.account.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.id, params.accountId),
        eq(table.userId, params.userId),
        eq(table.providerId, providerId),
      ),
  });

  if (!account) {
    throw new ORPCError("BAD_REQUEST", {
      message: "No connected account found for provider.",
    });
  }

  const requiredScope = getRequiredScope(params.provider);
  if (requiredScope && !account.scope?.includes(requiredScope)) {
    throw new ORPCError("BAD_REQUEST", {
      message: `Missing required ${requiredScope} scope.`,
    });
  }

  return account;
}

/**
 * Middleware to validate integration credentials and account connection.
 * @param params.credentials - The credentials object (optional)
 * @param params.provider - The integration provider
 * @param params.accountId - The account ID (optional, or null if being cleared)
 * @param params.requireAccountId - If true, accountId is required for providers that need it.
 *   For create, this should be true. For update, this should only be true if accountId is explicitly null.
 */
const validateIntegrationAccountMiddleware = os
  .$context<InitialContext & Session>()
  .middleware(
    async (
      { next, context },
      params: {
        credentials?: { provider: IntegrationProvider };
        provider: IntegrationProvider;
        accountId?: string | null;
      },
    ) => {
      if (
        params.credentials &&
        params.credentials.provider !== "webhook" &&
        params.credentials.provider !== "shopify"
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Credentials provider invalid.",
        });
      }

      if (
        params.credentials &&
        params.credentials.provider !== params.provider
      ) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Credentials provider does not match config provider.",
        });
      }

      if (params.accountId) {
        await assertAccountConnected({
          accountId: params.accountId,
          provider: params.provider,
          userId: context.user.id,
          db: context.db,
        });
      } else if (params.accountId === null && getProviderId(params.provider)) {
        throw new ORPCError("BAD_REQUEST", {
          message: "Account ID is required for this provider.",
        });
      }

      return await next({});
    },
  );

const list = protectedBase
  .route({ method: "GET", path: "/" })
  .input(type({ projectId: "string.uuid", organizationIdentifier: "string" }))
  .output(type({ integrations: integrationSummarySchema.array() }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const integrations = await listIntegrations(context.db, {
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!integrations.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: integrations.error.message,
      });
    }
    return {
      integrations: integrations.value.map((integration) => ({
        id: integration.id,
        provider: integration.provider,
        name: integration.name,
        status: integration.status,
        lastUsedAt: integration.lastUsedAt,
        lastError: integration.lastError,
        isDefault: integration.isDefault,
        updatedAt: integration.updatedAt,
      })),
    };
  });

const get = protectedBase
  .route({ method: "GET", path: "/{id}" })
  .input(
    type({
      projectId: "string.uuid",
      organizationIdentifier: "string",
      id: "string.uuid",
    }),
  )
  .output(type({ integration: integrationSummarySchema }))
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
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });
    }
    return {
      integration: {
        id: integration.value.id,
        provider: integration.value.provider,
        name: integration.value.name,
        status: integration.value.status,
        lastUsedAt: integration.value.lastUsedAt,
        lastError: integration.value.lastError,
        isDefault: integration.value.isDefault,
        updatedAt: integration.value.updatedAt,
      },
    };
  });

const create = protectedBase
  .route({ method: "POST", path: "/" })
  .input(
    type({
      "...": schema.seoIntegrationInsertSchema,
      organizationIdentifier: "string",
      "credentials?": integrationCredentialsSchema,
    }),
  )
  .output(type({ integration: integrationSummarySchema }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationAccountMiddleware, (input) => ({
    credentials: input.credentials,
    provider: input.config.provider,
    accountId: input.accountId,
  }))
  .handler(async ({ context, input }) => {
    const provider = input.config.provider;
    if (provider === "shopify") {
      throw new ORPCError("BAD_REQUEST", {
        message:
          "Shopify integrations should not be created via this endpoint.",
      });
    }

    const result = await createIntegration(context.db, {
      organizationId: context.organization.id,
      projectId: input.projectId,
      accountId: input.accountId ?? null,
      isDefault: input.isDefault ?? false,
      provider,
      name: input.name,
      status: "active",
      config: input.config,
      encryptedCredentials: input.credentials
        ? await encrypt(
            JSON.stringify(input.credentials),
            apiEnv().AUTH_SEO_ENCRYPTION_KEY,
          )
        : null,
    });
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: result.error.message,
      });
    }

    return { integration: result.value };
  });

const update = protectedBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    type({
      "...": schema.seoIntegrationUpdateSchema,
      "credentials?": integrationCredentialsSchema,
    }),
  )
  .output(type({ integrationId: "string.uuid" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationAccountMiddleware, (input) => ({
    credentials: input.credentials,
    provider: input.config.provider,
    accountId: input.accountId,
  }))
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
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });
    }

    if (input.config && input.config.provider !== integration.value.provider) {
      throw new ORPCError("BAD_REQUEST", {
        message: "Config doesn't match integration provider.",
      });
    }

    const result = await updateIntegration(context.db, {
      id: integration.value.id,
      organizationId: context.organization.id,
      projectId: input.projectId,
      values: {
        name: input.name,
        accountId: input.accountId,
        isDefault: input.isDefault,
        config: input.config,
        encryptedCredentials: input.credentials
          ? await encrypt(
              JSON.stringify(input.credentials),
              apiEnv().AUTH_SEO_ENCRYPTION_KEY,
            )
          : null,
      },
    });
    if (!result.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: result.error.message,
      });
    }

    return { integrationId: result.value.id };
  });

const remove = protectedBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(
    type({
      projectId: "string.uuid",
      organizationIdentifier: "string",
      id: "string.uuid",
    }),
  )
  .output(type({ success: "true" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const [removed] = await context.db
      .delete(schema.seoIntegration)
      .where(
        and(
          eq(schema.seoIntegration.id, input.id),
          eq(schema.seoIntegration.projectId, input.projectId),
          eq(schema.seoIntegration.organizationId, context.organization.id),
        ),
      )
      .returning();
    if (!removed) {
      throw new ORPCError("NOT_FOUND", { message: "Integration not found" });
    }
    return { success: true as const };
  });

export default protectedBase
  .prefix(
    "/organization/{organizationIdentifier}/project/{projectId}/integrations",
  )
  .router({
    list,
    get,
    create,
    update,
    remove,
    github,
    shopify,
    webhook,
  });
