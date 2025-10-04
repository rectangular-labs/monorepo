import { type } from "arktype";

export const backlinkInfoSchema = type({
  avgBacklinks: "number| null",
  avgDoFollow: "number| null",
  avgReferringPages: "number| null",
  avgReferringDomains: "number| null",
  avgReferringMainDomains: "number| null",
  avgRank: "number| null",
  avgMainDomainRank: "number| null",
});

export const serpPositionSchema = type({
  position: "number",
  estimatedTrafficVolume: "number | null",
});

export const serpResultSchema = type({
  title: "string",
  url: "string",
  description: "string | null",
});
