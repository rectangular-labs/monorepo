import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  project: lazy(() => import("./project")),
  campaign: {
    ...lazy(() => import("./campaign")),
    campaignKeywords: lazy(() => import("./campaign-keywords")),
  },
  companyBackground: lazy(() => import("./company-background")),
  auth: {
    session: lazy(() => import("./auth/session")),
    organization: lazy(() => import("./auth/organization")),
  },
});
