import { lazy } from "@orpc/server";
import { base } from "../context";

export const router = base.router({
  tasks: lazy(() => import("./tasks")),
});
