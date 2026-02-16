import type { AnyOrama } from "@orama/orama";
import { search } from "@orama/orama";
import { tool } from "ai";
import { type } from "arktype";
import type { SiteSchema } from "../orama/site-schema";

const toolInputSchema = type({
  query: type.string
    .atLeastLength(1)
    .describe(
      "Natural language query to find relevant business, audience, services, and industry info.",
    ),
});
export function createSearchSitesTool(db: AnyOrama<SiteSchema>) {
  return tool({
    description:
      "Search the indexed sites to find the most relevant pages. To get the full site data, use the `get-sites-data` tool.",
    inputSchema: toolInputSchema,
    execute: async ({ query }) => {
      const result = await search(db, {
        term: query,
        mode: "fulltext",
        limit: 50,
      });

      return {
        count: result.count,
        hits: result.hits.map((hit) => ({
          id: hit.id,
          score: hit.score,
          // return a compact preview for ranking; the full doc is obtainable via get-document
          preview: {
            url: hit.document.url,
            title: hit.document.title,
            description: hit.document.description,
          },
        })),
      };
    },
  });
}
