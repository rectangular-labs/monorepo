import { type AnyOrama, getByID } from "@orama/orama";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { SiteSchema } from "../orama/site-schema";

const toolInputSchema = type({
  ids: type("string[]").describe(
    "Document id from search-sites hits[number].id",
  ),
});
export function createGetSitesDataTool(db: AnyOrama<SiteSchema>) {
  return tool({
    description:
      "Retrieve the full, original site data by its hit id returned from the `search-sites` tool.",
    inputSchema: jsonSchema<typeof toolInputSchema.infer>(
      toolInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async ({ ids }) => {
      const documents = [];
      for (const id of ids) {
        const document = await getByID(db, id);
        if (!document) {
          continue;
        }
        const { contentHtml: _, text: __, extractor: ___, ...rest } = document;
        documents.push(rest);
      }
      return { found: documents.length > 0, documents };
    },
  });
}
