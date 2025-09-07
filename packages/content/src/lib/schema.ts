import { type } from "arktype";

export const DocSchema = type({
  title: "string",
  "description?": "string",
  "icon?": "string",
  "full?": "boolean",
  // TODO: add openapi thingy
  // "_openapi?": "Record<string, any>",

  // self defined
  "author?": "string",
});

export const PostSchema = type({
  "...": DocSchema,
  // blog-specific
  "cover?": "string",
  tags: type("string")
    .array()
    .default(() => []),
});

export const AuthorSchema = type({
  name: "string",
  image: "string",
});

export const MetaSchema = type({
  "title?": "string",
  "description?": "string",
  "icon?": "string",
  "pages?": "string[]",
  "root?": "boolean",
  "defaultOpen?": "boolean",
});
