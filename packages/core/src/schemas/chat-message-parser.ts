import { type } from "arktype";

export const chatMessageMetadataSchema = type({
  userId: "string|null",
  chatId: "string.uuid",
  sentAt: "string.date.iso",
});
