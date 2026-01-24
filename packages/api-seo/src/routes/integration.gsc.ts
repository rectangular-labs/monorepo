import { ORPCError } from "@orpc/server";
import {
  seoGscPermissionLevelSchema,
  seoGscPropertyTypeSchema,
} from "@rectangular-labs/core/schemas/gsc-property-parsers";
import {
  type GscProperty,
  listProperties as listGscProperties,
} from "@rectangular-labs/google-apis/google-search-console";
import { type } from "arktype";
import { protectedBase } from "../context";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";
import { getPublishingScopes } from "../lib/project/get-publishing-scopes";

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
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
    }),
  )
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
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
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

    const gscPublishingScopes = getPublishingScopes("google-search-console");
    if (!gscPublishingScopes) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "GSC publishing scopes not found.",
      });
    }
    const accountsWithScopes = accounts.filter((account) =>
      gscPublishingScopes.every((scope) => account.scope?.includes(scope)),
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
      properties: result.sort((a, b) => a.domain.localeCompare(b.domain)),
      hasGoogleAccount: true,
      hasGscScopes: true,
    };
  });

export const gsc = protectedBase.prefix("/gsc").router({
  listProperties,
});
