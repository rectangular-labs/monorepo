import { lazy } from "@orpc/server";

export const router = {
  project: lazy(() => import("./project")),
  // This is named campaigns because somehow using campaign causes the route to collide with the project router
  campaigns: lazy(() => import("./campaign")),
  task: lazy(() => import("./task")),
  schedule: lazy(() => import("./schedule")),
  googleSearchConsole: lazy(() => import("./google-search-console")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
};

export const websocketRouter = {
  campaign: lazy(() => import("./campaign.room")),
};
