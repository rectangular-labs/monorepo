import type { schema } from "@rectangular-labs/db";

export function formatMention(mention: typeof schema.smMention.$inferSelect) {
  if (!mention.title || !mention.content) {
    return null;
  }

  return `${mention.title}\n${mention.content}`;
}
