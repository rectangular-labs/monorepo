export const siteSchema = {
  title: "string",
  url: "string",
  description: "string",
  text: "string",
  contentHtml: "string",
  contentMarkdown: "string",
  extractor: "string",
} as const;
export type SiteSchema = typeof siteSchema;
