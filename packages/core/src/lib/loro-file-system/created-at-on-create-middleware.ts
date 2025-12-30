import type { WriteToFileMiddleware } from "@rectangular-labs/loro-file-system";
import type { FsNodePayload } from "./types";

export function addCreatedAtOnCreateMiddleware(): WriteToFileMiddleware<FsNodePayload> {
  return async ({ ctx, next }) => {
    const now = new Date().toISOString();
    ctx.addOnCreateNode((node) => {
      const existing = node.data.get("createdAt");
      if (typeof existing !== "string" || existing.trim() === "") {
        node.data.set("createdAt", now);
      }
      return node;
    });
    return await next();
  };
}


