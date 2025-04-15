import type { HonoEnv } from "@/lib/hono";
import { Hono } from "hono";

export const apiRouter = new Hono<HonoEnv>().get("/", (c) => {
  return c.json({ message: "Hello, World from the backend!" });
});
