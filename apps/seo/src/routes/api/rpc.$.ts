import { createApiContext } from "@rectangular-labs/api-seo/context";
import { RpcHandler } from "@rectangular-labs/api-seo/server";
import { createFileRoute } from "@tanstack/react-router";

async function handle({ request }: { request: Request }) {
  const context = createApiContext({
    url: new URL(request.url),
    reqHeaders: request.headers,
  });
  console.log("Handling request", context.url.href);
  const { response } = await RpcHandler.handle(request, {
    prefix: "/api/rpc",
    context,
  });

  return response ?? new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/rpc/$")({
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
