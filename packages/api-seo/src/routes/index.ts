import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  projects: lazy(() => import("./projects")),
  keywords: lazy(() => import("./keywords")),
  organization: lazy(() => import("./organization")),
  companyBackground: lazy(() => import("./company-background")),
});
