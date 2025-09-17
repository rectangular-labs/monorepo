import { createApiContext } from "@rectangular-labs/mentions-api/context";
import { RpcHandler } from "@rectangular-labs/mentions-api/server";
import { createServerFileRoute } from "@tanstack/react-start/server";

async function handle({ request }: { request: Request }) {
  const context = createApiContext({
    url: new URL(request.url),
  });

  const { response } = await RpcHandler.handle(request, {
    prefix: "/api/rpc",
    context,
  });

  return response ?? new Response("Not Found", { status: 404 });
}

export const ServerRoute = createServerFileRoute("/api/rpc/$").methods({
  HEAD: handle,
  GET: handle,
  POST: handle,
  PUT: handle,
  PATCH: handle,
  DELETE: handle,
});
