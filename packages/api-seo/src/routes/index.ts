import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  projects: lazy(() => import("./projects")),
  keywords: lazy(() => import("./keywords")),
  companyBackground: lazy(() => import("./company-background")),
});
