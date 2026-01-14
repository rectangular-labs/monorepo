import { getBlogRSS } from "@rectangular-labs/content/rss";
import { createFileRoute } from "@tanstack/react-router";
import { serverEnv } from "~/lib/env";

function handle() {
  const baseUrl = serverEnv().VITE_WWW_URL;
  const xml = getBlogRSS(baseUrl);
  return new Response(xml);
}

export const Route = createFileRoute("/blog/rss.xml")({
  server: {
    handlers: {
      GET: handle,
    },
  },
});
