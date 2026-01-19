import { err, ok } from "@rectangular-labs/result";
import type {
  ContentPayload,
  PublishAdapter,
  WebhookConfig,
} from "../../schemas/integration-parsers";

export const webhookAdapter = (
  createSignature: (payload: string, secret: string) => string,
) => {
  return {
    provider: "webhook",
    async healthCheck(config: WebhookConfig) {
      try {
        const response = await fetch(config.url, { method: "HEAD" });
        if (!response.ok && response.status !== 405) {
          return err(new Error(`Webhook endpoint returned ${response.status}`));
        }
        return ok({ ok: true });
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
    async publish(config: WebhookConfig, content) {
      const payload = JSON.stringify({
        event: "content.published",
        timestamp: new Date().toISOString(),
        content: {
          slug: content.slug,
          title: content.title,
          description: content.description,
          primaryKeyword: content.primaryKeyword,
          contentMarkdown: content.contentMarkdown,
          heroImage: content.heroImage ?? null,
          heroImageCaption: content.heroImageCaption ?? null,
          publishedAt: content.publishedAt?.toISOString(),
          articleType: content.articleType,
        } satisfies Omit<ContentPayload, "publishedAt"> & {
          publishedAt: string;
        },
      });

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...config.headers,
      };

      if (config.secret) {
        const headerName = config.secretHeaderName ?? "X-Webhook-Signature";
        headers[headerName] = createSignature(payload, config.secret);
      }

      try {
        const response = await fetch(config.url, {
          method: config.method,
          headers,
          body: payload,
        });

        if (!response.ok) {
          const errorText = await response.text();
          return err(
            new Error(`Webhook returned ${response.status}: ${errorText}`),
          );
        }

        let externalId = `webhook-${Date.now()}`;
        let externalUrl: string | undefined;
        try {
          const data = await response.json();
          if (data.id) externalId = String(data.id);
          if (data.url) externalUrl = String(data.url);
        } catch {
          // Response wasn't JSON.
        }

        return ok({
          externalId,
          externalUrl,
          handle: content.slug,
        });
      } catch (error) {
        return err(error instanceof Error ? error : new Error(String(error)));
      }
    },
  } satisfies PublishAdapter;
};
