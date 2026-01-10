import { lazy } from "@orpc/server";

export const router = {
  project: lazy(() => import("./project")),
  chat: lazy(() => import("./chat")),
  task: lazy(() => import("./task")),
  schedule: lazy(() => import("./schedule")),
  googleSearchConsole: lazy(() => import("./google-search-console")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
};
