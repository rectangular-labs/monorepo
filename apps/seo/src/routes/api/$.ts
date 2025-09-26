import { createApiContext } from "@rectangular-labs/api-seo/context";
import { openAPIHandler } from "@rectangular-labs/api-seo/server";
import { initAuthHandler } from "@rectangular-labs/auth/server";
import {
  createBlogSearchServer,
  createDocsSearchServer,
} from "@rectangular-labs/content/search";
import { createDb } from "@rectangular-labs/db";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { serverEnv } from "~/lib/env";

const docsSearch = createDocsSearchServer();
const blogSearch = createBlogSearchServer();

async function handle({ request }: { request: Request }) {
  if (new URL(request.url).pathname.startsWith("/api/auth/")) {
    const authServerHandler = initAuthHandler(
      serverEnv().VITE_SEO_URL,
      createDb(),
    );
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
    return await blogSearch.GET(request);
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

export const ServerRoute = createServerFileRoute("/api/$").methods({
  HEAD: handle,
  GET: handle,
  POST: handle,
  PUT: handle,
  PATCH: handle,
  DELETE: handle,
});
