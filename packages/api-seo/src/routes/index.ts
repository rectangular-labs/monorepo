import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  project: lazy(() => import("./project")),
  content: lazy(() => import("./content")),
  task: lazy(() => import("./task")),
  googleSearchConsole: lazy(() => import("./google-search-console")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
});
