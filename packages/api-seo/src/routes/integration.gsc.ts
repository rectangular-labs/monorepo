import { ORPCError } from "@orpc/server";
import {
  seoGscPermissionLevelSchema,
  seoGscPropertyTypeSchema,
} from "@rectangular-labs/core/schemas/gsc-property-parsers";
import {
  type GscConfig,
  gscConfigSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import {
  createIntegration,
  getProviderIntegration,
  updateIntegration,
} from "@rectangular-labs/db/operations";
import {
  type GscProperty,
  listProperties as listGscProperties,
} from "@rectangular-labs/google-apis/google-search-console";
import { type } from "arktype";
import { protectedBase } from "../context";
import { getGscIntegrationForProject } from "../lib/database/gsc-integration";
import { getPublishingScopes } from "../lib/project/get-publishing-scopes";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

function getPermissionLevel(
  permissionLevel: GscProperty["permissionLevel"],
): typeof seoGscPermissionLevelSchema.infer {
  if (permissionLevel === "siteOwner" || permissionLevel === "siteFullUser") {
    return "write";
  }
  if (permissionLevel === "siteRestrictedUser") {
    return "read-only";
  }
  return "needs-verification";
}

const listProperties = protectedBase
  .route({ method: "GET", path: "/property" })
  .input(type.undefined)
  .output(
    type({
      properties: type({
        accountId: "string",
        domain: "string",
        type: seoGscPropertyTypeSchema,
        permissionLevel: seoGscPermissionLevelSchema,
      }).array(),
      hasGoogleAccount: "boolean",
      hasGscScopes: "boolean",
    }),
  )
  .handler(async ({ context }) => {
    // 1. Check if user has connected Google accounts
    const accounts = await context.db.query.account.findMany({
      where: (table, { and, eq }) =>
        and(eq(table.userId, context.user.id), eq(table.providerId, "google")),
    });

    if (accounts.length === 0) {
      return {
        properties: [],
        hasGoogleAccount: false,
        hasGscScopes: false,
      };
    }

    const accountsWithScopes = accounts.filter((account) =>
      account.scope?.includes(
        getPublishingScopes("google-search-console") ?? "",
      ),
    );
    if (accountsWithScopes.length === 0) {
      return {
        properties: [],
        hasGoogleAccount: true,
        hasGscScopes: false,
      };
    }

    // 3. get tokens
    const accessTokens = await Promise.all(
      accountsWithScopes.map(async (account) => {
        return await context.auth.api.getAccessToken({
          body: {
            accountId: account.id,
            userId: account.userId,
            providerId: account.providerId,
          },
        });
      }),
    );

    // 4. Fetch properties using access tokens    const properties = (
    const result = (
      await Promise.all(
        accessTokens.map((accessToken) =>
          listGscProperties(accessToken.accessToken),
        ),
      )
    )
      .map((result, index) => {
        if (!result.ok) {
          console.error("Failed to get GSC properties", result.error.message);
          return null;
        }
        const account = accountsWithScopes[index];
        if (!account) return null;
        return result.value.map((property) => ({
          accountId: account.id,
          domain: property.domain,
          type: property.type,
          permissionLevel: getPermissionLevel(property.permissionLevel),
        }));
      })
      .filter((result) => result !== null)
      .flat();

    return {
      properties: result,
      hasGoogleAccount: true,
      hasGscScopes: true,
    };
  });

/**
 * Get the connected GSC property for a project (if any)
 */
const getConnectedPropertyForProject = protectedBase
  .route({ method: "GET", path: "/project/{projectId}" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
    }),
  )
  .output(
    type({
      integration: type({
        id: "string.uuid",
        status: "string",
        config: gscConfigSchema,
      }).or(type.null),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const integrationResult = await getProviderIntegration(context.db, {
      projectId: input.projectId,
      organizationId: context.organization.id,
      provider: "google-search-console",
      status: "active",
    });
    if (!integrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: integrationResult.error.message,
      });
    }
    const integration = integrationResult.value;
    if (!integration) {
      return { integration: null };
    }
    const config = integration.config;
    if (config.provider !== "google-search-console") {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Invalid provider",
      });
    }
    return {
      integration: {
        id: integration.id,
        status: integration.status,
        config,
      },
    };
  });

/**
 * Connect a GSC property to a project
 */
const connectToProject = protectedBase
  .route({ method: "POST", path: "/connect-to-project" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      accountId: "string",
      domain: "string",
      propertyType: seoGscPropertyTypeSchema,
      permissionLevel: seoGscPermissionLevelSchema,
    }),
  )
  .output(
    type({
      integrationId: "string.uuid",
      projectId: "string.uuid",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const gscIntegrationResult = await getGscIntegrationForProject({
      db: context.db,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!gscIntegrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: gscIntegrationResult.error.message,
      });
    }
    const integration = gscIntegrationResult.value;
    if (!integration) {
      throw new ORPCError("NOT_FOUND", {
        message: "GSC integration not found",
      });
    }

    const properties = await listGscProperties(integration.accessToken);
    if (!properties.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Failed to get GSC properties",
      });
    }
    const existingProperty = properties.value.find(
      (property) => property.domain === input.domain,
    );
    if (!existingProperty) {
      throw new ORPCError("NOT_FOUND", { message: "GSC property not found" });
    }

    const config: GscConfig = {
      provider: "google-search-console",
      domain: input.domain,
      propertyType: input.propertyType,
      permissionLevel: input.permissionLevel,
    };

    const existingIntegrationResult = await getProviderIntegration(context.db, {
      projectId: input.projectId,
      organizationId: context.organization.id,
      provider: "google-search-console",
    });
    if (!existingIntegrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: existingIntegrationResult.error.message,
      });
    }
    const existingIntegration = existingIntegrationResult.value;

    if (existingIntegration) {
      const updated = await updateIntegration(context.db, {
        id: existingIntegration.id,
        organizationId: context.organization.id,
        projectId: input.projectId,
        values: {
          accountId: input.accountId,
          config,
          status: "active",
          isDefault: true,
        },
      });
      if (!updated.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: updated.error.message,
        });
      }
      return {
        integrationId: updated.value.id,
        projectId: input.projectId,
      };
    }

    const created = await createIntegration(context.db, {
      organizationId: context.organization.id,
      projectId: input.projectId,
      accountId: input.accountId,
      isDefault: true,
      provider: "google-search-console",
      name: input.domain,
      status: "active",
      config,
      encryptedCredentials: null,
    });
    if (!created.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: created.error.message,
      });
    }

    return {
      integrationId: created.value.id,
      projectId: input.projectId,
    };
  });

const disconnectFromProject = protectedBase
  .route({ method: "DELETE", path: "/project/{projectId}" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
    }),
  )
  .output(
    type({
      projectId: "string.uuid",
      success: "true",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const integrationResult = await getGscIntegrationForProject({
      db: context.db,
      projectId: input.projectId,
      organizationId: context.organization.id,
    });
    if (!integrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: integrationResult.error.message,
      });
    }
    const integration = integrationResult.value;
    if (!integration) {
      throw new ORPCError("NOT_FOUND", {
        message: "GSC integration not found",
      });
    }

    const updated = await updateIntegration(context.db, {
      id: integration.id,
      organizationId: context.organization.id,
      projectId: input.projectId,
      values: {
        status: "disconnected",
        isDefault: false,
        accountId: null,
      },
    });
    if (!updated.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: updated.error.message,
      });
    }

    return { projectId: input.projectId, success: true as const };
  });

export const gsc = protectedBase.prefix("/gsc").router({
  listProperties,
  getConnectedPropertyForProject,
  connectToProject,
  disconnectFromProject,
});
