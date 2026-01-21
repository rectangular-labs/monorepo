import type {
  ContentPayload,
  PublishAdapter,
  ShopifyConfig,
  ShopifyCredentials,
} from "@rectangular-labs/core/schemas/integration-parsers";
import { err, ok, type Result } from "@rectangular-labs/result";
import { createAdminApiClient } from "@shopify/admin-api-client";

const SHOPIFY_API_VERSION = "2024-10";

function createClient(config: ShopifyConfig, credentials: ShopifyCredentials) {
  return createAdminApiClient({
    apiVersion: SHOPIFY_API_VERSION,
    storeDomain: config.shopDomain,
    accessToken: credentials.accessToken ?? "",
  });
}

export const shopifyAdapter = () => {
  const listBlogs = async (
    config: ShopifyConfig,
    credentials: ShopifyCredentials,
  ): Promise<Result<Array<{ id: string; title: string; handle: string }>>> => {
    const client = createClient(config, credentials);
    try {
      const response = await client.request(`
        query ListBlogs {
          blogs(first: 50) {
            nodes { id title handle }
          }
        }
      `);
      if (response.errors) {
        return err(new Error(response.errors.message));
      }
      return ok(response.data.blogs.nodes);
    } catch (error) {
      return err(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return {
    ...({
      provider: "shopify" as const,
      async healthCheck(
        config: ShopifyConfig,
        credentials: ShopifyCredentials,
      ) {
        const result = await listBlogs(config, credentials);
        if (!result.ok) return result;
        return ok({ ok: true });
      },

      async publish(
        config: ShopifyConfig,
        content: ContentPayload,
        credentials: ShopifyCredentials,
      ) {
        if (!config.blogId) {
          return err(new Error("Blog not configured"));
        }

        const client = createClient(config, credentials);
        const publishAsHtml = config.publishAsHtml ?? true;
        const bodyHtml = publishAsHtml
          ? content.contentMarkdown // TODO (shopify): convert markdown to HTML
          : `<div data-markdown="true">${content.contentMarkdown}</div>`;

        try {
          const response = await client.request(
            `
        mutation ArticleCreate($article: ArticleCreateInput!) {
          articleCreate(article: $article) {
            article { id handle onlineStoreUrl }
            userErrors { field message }
          }
        }
      `,
            {
              variables: {
                article: {
                  blogId: config.blogId,
                  title: content.title,
                  handle: content.slug,
                  body: bodyHtml,
                  summary: content.description,
                  published: true,
                  publishedAt: content.publishedAt?.toISOString(),
                },
              },
            },
          );

          const errors = response.data?.articleCreate?.userErrors ?? [];
          if (errors.length > 0) {
            return err(new Error("Something went wrong creating an article."));
          }

          const article = response.data.articleCreate.article;
          return ok({
            externalId: article.id,
            externalUrl: article.onlineStoreUrl,
            handle: article.handle,
          });
        } catch (error) {
          return err(error instanceof Error ? error : new Error(String(error)));
        }
      },
    } satisfies PublishAdapter),
    async exchangeCodeForToken(params: {
      code: string;
      shop: string;
      clientId: string;
      clientSecret: string;
    }): Promise<Result<{ accessToken: string; refreshToken?: string }>> {
      const tokenUrl = `https://${params.shop}/admin/oauth/access_token`;
      try {
        const response = await fetch(tokenUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            client_id: params.clientId,
            client_secret: params.clientSecret,
            code: params.code,
          }),
        });
        if (!response.ok) {
          return err(
            new Error(`Token exchange failed: ${await response.text()}`),
          );
        }
        const data = await response.json();
        return ok({
          accessToken: data.access_token,
          refreshToken: data.refresh_token ?? undefined,
        });
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
    listBlogs,

    async createBlog(
      config: ShopifyConfig,
      credentials: ShopifyCredentials,
      params: { title: string; handle?: string },
    ): Promise<Result<{ id: string; title: string; handle: string }>> {
      const client = createClient(config, credentials);
      try {
        const response = await client.request(
          `mutation BlogCreate($blog: BlogCreateInput!) {
          blogCreate(blog: $blog) {
            blog { id title handle }
            userErrors { field message }
          }
        }`,
          { variables: { blog: params } },
        );

        const errors = response.data?.blogCreate?.userErrors ?? [];
        if (errors.length > 0) {
          return err(new Error("Something went wrong creating a blog."));
        }
        return ok(response.data.blogCreate.blog);
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
};
