import { createSeoBlogSearchServer } from "@rectangular-labs/content/search";
import { createFileRoute } from "@tanstack/react-router";

const seoBlogSearch = createSeoBlogSearchServer();

export const Route = createFileRoute("/api/blog/search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return await seoBlogSearch.GET(request);
      },
    },
  },
});
