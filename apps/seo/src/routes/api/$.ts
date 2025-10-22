import { createApiContext } from "@rectangular-labs/api-seo/context";
import { openAPIHandler } from "@rectangular-labs/api-seo/server";
import { initAuthHandler } from "@rectangular-labs/auth/server";
import {
  createDocsSearchServer,
  createSeoBlogSearchServer,
} from "@rectangular-labs/content/search";
import { createDb } from "@rectangular-labs/db";
import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "~/lib/env";

const docsSearch = createDocsSearchServer();
const seoBlogSearch = createSeoBlogSearchServer();

async function handle({ request }: { request: Request }) {
  if (new URL(request.url).pathname.startsWith("/api/auth/")) {
    const env = serverEnv();
    const authServerHandler = initAuthHandler({
      baseURL: env.VITE_SEO_URL,
      db: createDb(),
      encryptionKey: env.AUTH_SEO_ENCRYPTION_KEY,
      fromEmail: env.AUTH_SEO_FROM_EMAIL,
      inboundApiKey: env.SEO_INBOUND_API_KEY,
      credentialVerificationType: env.AUTH_SEO_CREDENTIAL_VERIFICATION_TYPE,
      discordClientId: env.AUTH_SEO_DISCORD_ID,
      discordClientSecret: env.AUTH_SEO_DISCORD_SECRET,
      githubClientId: env.AUTH_SEO_GITHUB_ID,
      githubClientSecret: env.AUTH_SEO_GITHUB_SECRET,
      googleClientId: env.AUTH_SEO_GOOGLE_CLIENT_ID,
      googleClientSecret: env.AUTH_SEO_GOOGLE_CLIENT_SECRET,
    });
    return await authServerHandler.handler(request);
  }

  if (new URL(request.url).pathname.startsWith("/api/docs/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return await docsSearch.GET(request);
  }
  if (new URL(request.url).pathname.startsWith("/api/blog/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return await seoBlogSearch.GET(request);
  }

  const env = serverEnv();
  const context = createApiContext({
    url: new URL(request.url),
    reqHeaders: request.headers,
  });

  const { response } = await openAPIHandler(`${env.VITE_SEO_URL}/api`).handle(
    request,
    {
      prefix: "/api",
      context,
    },
  );

  return response ?? new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
      POST: handle,
      PUT: handle,
      PATCH: handle,
      DELETE: handle,
    },
  },
});
