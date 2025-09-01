import { createSearchServer } from "@rectangular-labs/content/search";
import { createServerFileRoute } from "@tanstack/react-start/server";

const server = createSearchServer();
export const ServerRoute = createServerFileRoute("/api/search").methods({
  GET: async ({ request }) => server.GET(request),
});
