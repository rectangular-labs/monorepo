import { createApiContext } from "@rectangular-labs/api/context";
import { openAPIHandler } from "@rectangular-labs/api/server";
import { initAuthHandler } from "@rectangular-labs/auth";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { serverEnv } from "~/lib/env";

async function handle({ request }: { request: Request }) {
  if (new URL(request.url).pathname.startsWith("/api/auth/")) {
    const auth = initAuthHandler();
    return await auth.handler(request);
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
