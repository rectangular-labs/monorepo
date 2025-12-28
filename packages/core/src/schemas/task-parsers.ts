import { type } from "arktype";
import { businessBackgroundSchema } from "./project-parsers";

export const understandSiteTaskInputSchema = type({
  type: "'understand-site'",
  websiteUrl: "string",
});
export const taskInputSchema = type.or(understandSiteTaskInputSchema);

export const understandSiteTaskOutputSchema = type({
  type: "'understand-site'",
  websiteInfo: businessBackgroundSchema.merge(type({ name: "string" })),
});

export const taskOutputSchema = type.or(understandSiteTaskOutputSchema);
