import { getBlogRSS } from "@rectangular-labs/content/rss";
import { createServerFileRoute } from "@tanstack/react-start/server";
import { serverEnv } from "~/lib/env";

function handle() {
  const baseUrl = serverEnv().VITE_SEO_URL;
  const xml = getBlogRSS(baseUrl);
  return new Response(xml);
}

export const ServerRoute = createServerFileRoute(
  "/_marketing/blog/rss.xml",
).methods({
  GET: handle,
});
