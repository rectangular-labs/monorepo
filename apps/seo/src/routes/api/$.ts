import { env as CloudflareEnv } from "cloudflare:workers";
import { createApiContext } from "@rectangular-labs/api-seo/context";
import { openAPIHandler } from "@rectangular-labs/api-seo/server";
import { initAuthHandler } from "@rectangular-labs/auth/server";
import { createSeoBlogSearchServer } from "@rectangular-labs/content/search";
import { createDb } from "@rectangular-labs/db";
import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "~/lib/env";

const seoBlogSearch = createSeoBlogSearchServer();

async function handle({ request }: { request: Request }) {
  const env = serverEnv();
  const requestUrl = new URL(request.url);
  if (requestUrl.pathname.startsWith("/api/auth/")) {
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
  if (requestUrl.pathname.startsWith("/api/blog/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return await seoBlogSearch.GET(request);
  }

  if (
    requestUrl.pathname.startsWith("/api/user-vm/") &&
    "USER_VM_CONTAINER" in CloudflareEnv &&
    typeof CloudflareEnv.USER_VM_CONTAINER === "object" &&
    CloudflareEnv.USER_VM_CONTAINER &&
    "getByName" in CloudflareEnv.USER_VM_CONTAINER &&
    typeof CloudflareEnv.USER_VM_CONTAINER.getByName === "function"
  ) {
    // TODO: cloudflare session ID
    const userVmInstance = CloudflareEnv.USER_VM_CONTAINER.getByName(
      requestUrl.pathname,
    );
    await userVmInstance.startAndWaitForPorts({
      ports: [parseInt(env.USER_VM_PORT ?? "3000", 10)],
      startOptions: {
        enableInternet: true,
        envVars: {
          ...Object.fromEntries(
            Object.entries(env).filter(([_, value]) => value !== undefined),
          ),
          DATABASE_URL: env.DATABASE_URL.replace(
            "localhost",
            "host.docker.internal",
          ),
        },
      },
    });
    console.log(`container started: ${userVmInstance.id}`);
    const response = await userVmInstance.fetch(request);
    console.log("response", response);
    return response;
  }

  if (requestUrl.pathname.startsWith("/api/websocket/")) {
    const roomId = requestUrl.pathname.split("/api/websocket/").pop() ?? "";
    const stub = CloudflareEnv.WEBSOCKET_SERVER.getByName(roomId);
    return stub.fetch(request);
  }

  const context = createApiContext({
    url: requestUrl,
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
