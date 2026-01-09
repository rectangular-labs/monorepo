import { type } from "arktype";

export const chatMessageMetadataSchema = type({
  userId: "string|null",
  sentAt: "string.date.iso",
});
