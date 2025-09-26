import { type AnyOrama, getByID } from "@orama/orama";
import { type JSONSchema7, jsonSchema, tool } from "ai";
import { type } from "arktype";
import type { SiteSchema } from "../orama/site-schema";

const toolInputSchema = type({
  ids: type("string[]").describe(
    "Document id from search-sites hits[number].id",
  ),
});

const documentSchema = type({
  id: "string|number",
  title: "string",
  url: "string",
  description: "string",
  contentMarkdown: "string",
});
const toolOutputSchema = type({
  found: "boolean",
  documents: documentSchema.array(),
});

export function createGetSitesDataTool(db: AnyOrama<SiteSchema>) {
  return tool({
    description:
      "Retrieve the full, original site data by its hit id returned from the `search-sites` tool.",
    inputSchema: jsonSchema<typeof toolInputSchema.infer>(
      toolInputSchema.toJsonSchema() as JSONSchema7,
    ),
    outputSchema: jsonSchema<typeof toolOutputSchema.infer>(
      toolOutputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async ({ ids }) => {
      const documents: (typeof documentSchema.infer)[] = [];
      for (const id of ids) {
        const document = await getByID(db, id);
        if (!document) {
          continue;
        }
        documents.push({
          id: document.id,
          title: document.title,
          url: document.url,
          description: document.description,
          contentMarkdown: document.contentMarkdown,
        });
      }
      return { found: documents.length > 0, documents };
    },
  });
}
