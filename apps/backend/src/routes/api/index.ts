import type { HonoEnv } from "@/lib/hono";
import { Hono } from "hono";
import { chatRouter } from "./chat";

export const apiRouter = new Hono<HonoEnv>()
  .get("/", (c) => {
    return c.json({ message: "Hello, World from the backend!" });
  })
  .route("/chat", chatRouter);
