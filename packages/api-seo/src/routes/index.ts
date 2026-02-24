import { lazy } from "@orpc/server";

export const router = {
  project: lazy(() => import("./project")),
  chat: lazy(() => import("./chat")),
  task: lazy(() => import("./task")),
  content: lazy(() => import("./content")),
  strategy: lazy(() => import("./strategy")),
  integrations: lazy(() => import("./integration")),
  admin: lazy(() => import("./admin")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
};
