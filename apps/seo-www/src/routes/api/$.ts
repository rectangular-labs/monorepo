import { createSeoBlogSearchServer } from "@rectangular-labs/content/search";
import { createFileRoute } from "@tanstack/react-router";

const seoBlogSearch = createSeoBlogSearchServer();

async function handle({ request }: { request: Request }) {
  const requestUrl = new URL(request.url);

  if (requestUrl.pathname.startsWith("/api/blog/search")) {
    if (request.method !== "GET") {
      return new Response("Method not allowed", { status: 405 });
    }
    return await seoBlogSearch.GET(request);
  }

  return new Response("Not Found", { status: 404 });
}

export const Route = createFileRoute("/api/$")({
  server: {
    handlers: {
      HEAD: handle,
      GET: handle,
    },
  },
});
