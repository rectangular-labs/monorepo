import { randomBytes } from "node:crypto";
import { ORPCError } from "@orpc/server";
import { decrypt, encrypt } from "@orpc/server/helpers";
import { shopifyAdapter } from "@rectangular-labs/core/integrations/adapters/shopify-adapter";
import {
  type ShopifyConfig,
  type ShopifyCredentials,
  shopifyCredentialsSchema,
} from "@rectangular-labs/core/schemas/integration-parsers";
import {
  createIntegration,
  getIntegration,
  getSeoProjectByIdentifierAndOrgId,
  updateIntegration,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { protectedBase } from "../context";
import { apiEnv } from "../env";
import { validateIntegrationMiddleware } from "../lib/middleware/validate-integration";
import { validateOrganizationMiddleware } from "../lib/middleware/validate-organization";

const SHOPIFY_SCOPES = ["read_content", "write_content"].join(",");

function normalizeShopDomain(shopDomain: string) {
  return shopDomain.replace(/^https?:\/\//, "");
}

// todo (shopify): simplify this
const initiate = protectedBase
  .route({ method: "POST", path: "/initiate" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      name: "string",
      shopDomain: "string",
      adminUrl: "string",
      clientId: "string",
      clientSecret: "string",
      "isDefault?": "boolean",
    }),
  )
  .output(type({ integrationId: "string.uuid", authorizationUrl: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const project = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.projectId,
      context.organization.id,
    );
    if (!project.ok || !project.value) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found." });
    }

    const oauthState = randomBytes(16).toString("hex");
    const shopDomain = normalizeShopDomain(input.shopDomain);

    const credentials: ShopifyCredentials = {
      provider: "shopify",
      clientId: input.clientId,
      clientSecret: input.clientSecret,
      _oauthState: oauthState,
    };

    const created = await createIntegration(context.db, {
      organizationId: context.organization.id,
      projectId: input.projectId,
      accountId: null,
      isDefault: input.isDefault ?? false,
      provider: "shopify",
      name: input.name,
      status: "pending_setup",
      config: {
        provider: "shopify",
        shopDomain,
        adminUrl: input.adminUrl,
      },
      encryptedCredentials: await encrypt(
        JSON.stringify(credentials),
        apiEnv().AUTH_SEO_ENCRYPTION_KEY,
      ),
    });

    if (!created.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: created.error.message,
      });
    }
    const integration = created.value;
    const redirectUri = new URL(
      `organization/${context.organization.id}/project/${input.projectId}/integrations/shopify/callback`,
      apiEnv().SEO_URL,
    ).toString();
    const state = `${integration.id}:${oauthState}`;
    const query = new URLSearchParams({
      client_id: input.clientId,
      scope: SHOPIFY_SCOPES,
      redirect_uri: redirectUri,
      state,
    });
    const authorizationUrl = `https://${shopDomain}/admin/oauth/authorize?${query.toString()}`;

    return { integrationId: integration.id, authorizationUrl };
  });

const callback = protectedBase
  .route({ method: "GET", path: "/callback" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      code: "string",
      shop: "string",
      state: "string",
    }),
  )
  .output(type({ integrationId: "string.uuid", success: "true" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .handler(async ({ context, input }) => {
    const [integrationId, oauthState] = input.state.split(":");
    if (!integrationId || !oauthState) {
      throw new ORPCError("BAD_REQUEST", { message: "Invalid state value." });
    }

    const integrationResult = await getIntegration(context.db, {
      id: integrationId,
      organizationId: context.organization.id,
      projectId: input.projectId,
    });

    if (!integrationResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: integrationResult.error.message,
      });
    }
    if (!integrationResult.value) {
      throw new ORPCError("NOT_FOUND", { message: "Integration not found." });
    }
    const integration = integrationResult.value;

    const config = integration.config;
    if (config.provider !== "shopify") {
      throw new ORPCError("BAD_REQUEST", {
        message: "Invalid integration provider.",
      });
    }

    let credentials: ShopifyCredentials;
    try {
      const decryptedString = await decrypt(
        integration.encryptedCredentials ?? "",
        apiEnv().AUTH_SEO_ENCRYPTION_KEY,
      );
      if (!decryptedString) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt integration credentials.",
        });
      }
      const parsedCredentials = shopifyCredentialsSchema(
        JSON.parse(decryptedString),
      );
      if (parsedCredentials instanceof type.errors) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse integration credentials.",
          cause: parsedCredentials,
        });
      }
      credentials = parsedCredentials;
    } catch (error) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message:
          error instanceof Error
            ? error.message
            : "Failed to decrypt integration credentials.",
        cause: error,
      });
    }

    if (credentials._oauthState !== oauthState) {
      throw new ORPCError("BAD_REQUEST", {
        message: "OAuth state mismatch.",
      });
    }

    const shopDomain = normalizeShopDomain(input.shop);
    if (config.shopDomain !== shopDomain) {
      throw new ORPCError("BAD_REQUEST", { message: "Shop mismatch." });
    }

    const exchangeResult = await shopifyAdapter().exchangeCodeForToken({
      code: input.code,
      shop: shopDomain,
      clientId: credentials.clientId,
      clientSecret: credentials.clientSecret,
    });
    if (!exchangeResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: exchangeResult.error.message,
      });
    }

    const updatedCredentials: ShopifyCredentials = {
      ...credentials,
      accessToken: exchangeResult.value.accessToken,
      ...(exchangeResult.value.refreshToken && {
        refreshToken: exchangeResult.value.refreshToken,
      }),
    };
    delete updatedCredentials._oauthState;

    const encryptedCredentials = await encrypt(
      JSON.stringify(updatedCredentials),
      apiEnv().AUTH_SEO_ENCRYPTION_KEY,
    );

    const updated = await updateIntegration(context.db, {
      id: integration.id,
      organizationId: context.organization.id,
      projectId: input.projectId,
      values: { encryptedCredentials },
    });
    if (!updated.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: updated.error.message,
      });
    }

    return { integrationId: integration.id, success: true as const };
  });

const listBlogs = protectedBase
  .route({ method: "GET", path: "/{id}/blogs" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
    }),
  )
  .output(
    type({
      blogs: type({
        id: "string",
        title: "string",
        handle: "string",
      }).array(),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationMiddleware, (input) => ({
    id: input.id,
    projectId: input.projectId,
  }))
  .handler(async ({ context }) => {
    const integration = context.integration;
    const config = integration.config as ShopifyConfig;
    let credentials: ShopifyCredentials;
    try {
      const decryptedString = await decrypt(
        integration.encryptedCredentials ?? "",
        apiEnv().AUTH_SEO_ENCRYPTION_KEY,
      );
      if (!decryptedString) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt integration credentials.",
        });
      }
      const parsedCredentials = shopifyCredentialsSchema(
        JSON.parse(decryptedString),
      );
      if (parsedCredentials instanceof type.errors) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse integration credentials.",
          cause: parsedCredentials,
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

    const blogsResult = await shopifyAdapter().listBlogs(config, credentials);
    if (!blogsResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: blogsResult.error.message,
      });
    }

    let blogs = blogsResult.value;
    // TODO(shopify): we probably don't want the side effect of creating a blog on a GET endpoint.
    if (blogs.length === 0) {
      const createResult = await shopifyAdapter().createBlog(
        config,
        credentials,
        {
          title: "Blog",
        },
      );
      if (!createResult.ok) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: createResult.error.message,
        });
      }
      blogs = [createResult.value];
    }

    return { blogs };
  });

const createBlog = protectedBase
  .route({ method: "POST", path: "/{id}/blogs" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      title: "string",
      "handle?": "string",
    }),
  )
  .output(
    type({
      blog: type({
        id: "string",
        title: "string",
        handle: "string",
      }),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationMiddleware, (input) => ({
    id: input.id,
    projectId: input.projectId,
  }))
  .handler(async ({ context, input }) => {
    const integration = context.integration;
    const config = integration.config as ShopifyConfig;
    let credentials: ShopifyCredentials;
    try {
      const decryptedString = await decrypt(
        integration.encryptedCredentials ?? "",
        apiEnv().AUTH_SEO_ENCRYPTION_KEY,
      );
      if (!decryptedString) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to decrypt integration credentials.",
        });
      }
      const parsedCredentials = shopifyCredentialsSchema(
        JSON.parse(decryptedString),
      );
      if (parsedCredentials instanceof type.errors) {
        throw new ORPCError("INTERNAL_SERVER_ERROR", {
          message: "Failed to parse integration credentials.",
          cause: parsedCredentials,
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

    const createResult = await shopifyAdapter().createBlog(
      config,
      credentials,
      {
        title: input.title,
        ...(input.handle && { handle: input.handle }),
      },
    );
    if (!createResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: createResult.error.message,
      });
    }

    return { blog: createResult.value };
  });

const selectBlog = protectedBase
  .route({ method: "POST", path: "/{id}/select-blog" })
  .input(
    type({
      organizationIdentifier: "string",
      projectId: "string.uuid",
      id: "string.uuid",
      blogId: "string",
      "blogTitle?": "string",
      "authorId?": "string",
      "publishAsHtml?": "boolean",
    }),
  )
  .output(type({ success: "true" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .use(validateIntegrationMiddleware, (input) => ({
    id: input.id,
    projectId: input.projectId,
  }))
  .handler(async ({ context, input }) => {
    const integration = context.integration;
    const config = integration.config as ShopifyConfig;

    const updatedConfig: ShopifyConfig = {
      ...config,
      blogId: input.blogId,
      blogTitle: input.blogTitle ?? config.blogTitle ?? null,
      authorId: input.authorId ?? config.authorId ?? null,
      publishAsHtml: input.publishAsHtml ?? config.publishAsHtml ?? true,
    };

    const updated = await updateIntegration(context.db, {
      id: integration.id,
      organizationId: context.organization.id,
      projectId: input.projectId,
      values: { config: updatedConfig, status: "active" },
    });
    if (!updated.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: updated.error.message,
      });
    }

    return { success: true as const };
  });

export const shopify = protectedBase.prefix("/shopify").router({
  initiate,
  callback,
  listBlogs,
  createBlog,
  selectBlog,
});
