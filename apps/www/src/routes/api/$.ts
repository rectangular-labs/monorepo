import { createApiContext } from "@rectangular-labs/api/context";
import { openAPIHandler } from "@rectangular-labs/api/server";
import { initAuthHandler } from "@rectangular-labs/auth";
import {
  createBlogSearchServer,
  createDocsSearchServer,
} from "@rectangular-labs/content/search";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { serverEnv } from "~/lib/env";

async function handle({ request }: { request: Request }) {
  if (new URL(request.url).pathname.startsWith("/api/auth/")) {
    const auth = initAuthHandler();
    return await auth.handler(request);
  }

  if (new URL(request.url).pathname.startsWith("/api/docs/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const search = createDocsSearchServer();
    return await search.GET(request);
  }
  if (new URL(request.url).pathname.startsWith("/api/blog/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    const search = createBlogSearchServer();
    return await search.GET(request);
  }

  const env = serverEnv();
  const context = createApiContext({
    dbUrl: env.DATABASE_URL,
    url: new URL(request.url),
  });

  const { response } = await openAPIHandler(`${env.VITE_APP_URL}/api`).handle(
    request,
    {
      prefix: "/api",
      context,
    },
  );

  return response ?? new Response("Not Found", { status: 404 });
}

export const ServerRoute = createServerFileRoute("/api/$").methods({
  HEAD: handle,
  GET: handle,
  POST: handle,
  PUT: handle,
  PATCH: handle,
  DELETE: handle,
});
