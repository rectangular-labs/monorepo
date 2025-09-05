import { readFileSync } from "node:fs";
import { safeSync } from "@rectangular-labs/result";
import { type } from "arktype";
import { AuthorSchema } from "../schema";
export function getAuthor(authorId?: string): typeof AuthorSchema.infer | null {
  if (!authorId) return null;
  const author = readFileSync(`authors/${authorId}.json`, "utf-8");
  const parsedFIle = safeSync(() => JSON.parse(author));
  if (!parsedFIle.ok) return null;

  const parsedAuthor = AuthorSchema(parsedFIle.value);
  if (parsedAuthor instanceof type.errors) {
    return null;
  }
  return parsedAuthor;
}
