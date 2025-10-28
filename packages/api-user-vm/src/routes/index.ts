import { lazy } from "@orpc/server";
import { protectedBase } from "../lib/context";

export const router = protectedBase.router({
  content: lazy(() => import("./content")),
});
