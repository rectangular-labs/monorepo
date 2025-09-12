import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  projects: lazy(() => import("./projects")),
  keywords: lazy(() => import("./keywords")),
  mentions: lazy(() => import("./mentions")),
  replies: lazy(() => import("./replies")),
});
