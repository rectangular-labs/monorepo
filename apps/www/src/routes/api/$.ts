import { createDocsSearchServer } from "@rectangular-labs/content/search";
import { createFileRoute } from "@tanstack/react-router";

const docsSearch = createDocsSearchServer();

async function handle({ request }: { request: Request }) {
  if (new URL(request.url).pathname.startsWith("/api/docs/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return await docsSearch.GET(request);
  }

  return new Response("Not Found", { status: 404 });
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
