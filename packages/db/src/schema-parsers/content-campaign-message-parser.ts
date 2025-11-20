import { type } from "arktype";

export const contentCampaignMessageMetadataSchema = type({
  userId: "string|null",
  sentAt: "string.date.iso",
});
