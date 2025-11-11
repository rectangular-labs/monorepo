import { type } from "arktype";
import { seoWebsiteInfoSchema } from "./project-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  websiteUrl: "string",
});
export const taskInputSchema = type.or(understandSiteTaskInputSchema);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: seoWebsiteInfoSchema.merge(type({ name: "string" })),
});

export const taskOutputSchema = type.or(understandSiteTaskOutputSchema);
