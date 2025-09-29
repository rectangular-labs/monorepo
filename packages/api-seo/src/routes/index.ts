import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  project: lazy(() => import("./project")),
  campaign: {
    ...lazy(() => import("./campaign")),
  },
  task: lazy(() => import("./task")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
});
