import { Hono } from "hono";
import type { HonoEnv } from "../../lib/hono";
import { authRouter } from "./auth/route";

export const apiRouter = new Hono<HonoEnv>()
  .get("/", (c) => {
    return c.json({ message: "Hello, World from the backend!" });
  })
  .route("/auth", authRouter);
