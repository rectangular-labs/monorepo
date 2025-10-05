import { ORPCError } from "@orpc/server";
import {
  connectGscPropertyToProject,
  upsertGscProperty,
} from "@rectangular-labs/db/operations";
import {
  seoGscPermissionLevelSchema,
  seoGscPropertyTypeSchema,
} from "@rectangular-labs/db/parsers";
import {
  createGscClient,
  type GscProperty,
  listProperties as listGscProperties,
} from "@rectangular-labs/google-apis/google-search-console";
import { safe } from "@rectangular-labs/result";
import { type } from "arktype";
import { protectedBase } from "../context";
import { apiEnv } from "../env";

function getPermissionLevel(
  permissionLevel: GscProperty["permissionLevel"],
): typeof seoGscPermissionLevelSchema.infer {
  if (permissionLevel === "siteOwner" || permissionLevel === "siteFull") {
    return "write";
  }
  if (permissionLevel === "siteRestricted") {
    return "read-only";
  }
  return "needs-verification";
}

/**
 * List all GSC properties accessible by the authenticated user
 */
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
      account.scope?.includes("webmasters"),
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
            providerId: account.providerId,
            accountId: account.accountId,
            userId: account.userId,
          },
        });
      }),
    );

    const env = apiEnv();
    // 4. Initialize GSC client and fetch properties
    const gscClients = accessTokens.map((accessToken) => {
      return createGscClient({
        credentials: {
          clientId: env.AUTH_GOOGLE_CLIENT_ID,
          clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
          accessToken: accessToken.accessToken,
          expiryDate: accessToken.accessTokenExpiresAt,
          scopes: accessToken.scopes,
          idToken: accessToken.idToken,
        },
      });
    });

    const result = (
      await Promise.all(
        gscClients.map((gscClient) => listGscProperties(gscClient)),
      )
    )
      .map((result, index) => {
        if (!result.ok) {
          return null;
        }
        const account = accountsWithScopes[index];
        if (!account) {
          return null;
        }
        return result.value.map((property) => ({
          accountId: account.accountId,
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
 * Connect a GSC property to a project
 */
const connectToProject = protectedBase
  .route({ method: "POST", path: "/connect-to-project" })
  .input(
    type({
      projectId: "string.uuid",
      accountId: "string",
      domain: "string",
      propertyType: seoGscPropertyTypeSchema,
      permissionLevel: seoGscPermissionLevelSchema,
    }),
  )
  .output(
    type({
      gscPropertyId: "string.uuid",
      projectId: "string.uuid",
    }),
  )
  .handler(async ({ context, input }) => {
    // Get user's Google account
    const accessToken = await safe(() =>
      context.auth.api.getAccessToken({
        body: {
          providerId: "google",
          accountId: input.accountId,
          userId: context.user.id,
        },
      }),
    );

    if (!accessToken.ok) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No Google account connected.",
      });
    }

    // Check if property already exists for this organization
    const env = apiEnv();
    const gscClient = createGscClient({
      credentials: {
        clientId: env.AUTH_GOOGLE_CLIENT_ID,
        clientSecret: env.AUTH_GOOGLE_CLIENT_SECRET,
        accessToken: accessToken.value.accessToken,
        expiryDate: accessToken.value.accessTokenExpiresAt,
      },
    });
    const properties = await listGscProperties(gscClient);
    if (!properties.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to get GSC properties`,
      });
    }
    const existingPropertyResult = properties.value.find(
      (property) => property.domain === input.domain,
    );
    if (!existingPropertyResult) {
      throw new ORPCError("NOT_FOUND", {
        message: `GSC property not found`,
      });
    }

    // property exists, upsert GSC property
    const account = await context.db.query.account.findFirst({
      where: (table, { and, eq }) =>
        and(
          eq(table.userId, context.user.id),
          eq(table.providerId, "google"),
          eq(table.accountId, input.accountId),
        ),
    });
    if (!account) {
      throw new ORPCError("UNAUTHORIZED", {
        message: "No Google account connected.",
      });
    }
    const upsertResult = await upsertGscProperty(context.db, {
      accountId: account.id,
      domain: input.domain,
      type: input.propertyType,
      permissionLevel: input.permissionLevel,
    });
    if (!upsertResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to upsert GSC property: ${upsertResult.error.message}`,
      });
    }

    // Connect GSC property to project
    const connectResult = await connectGscPropertyToProject(
      context.db,
      input.projectId,
      upsertResult.value.id,
    );

    if (!connectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: `Failed to connect GSC property to project: ${connectResult.error.message}`,
      });
    }

    return {
      gscPropertyId: upsertResult.value.id,
      projectId: input.projectId,
    };
  });

export default protectedBase
  .prefix("/google-search-console")
  .router({ listProperties, connectToProject });
