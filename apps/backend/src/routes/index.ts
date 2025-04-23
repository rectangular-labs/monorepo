import { Hono } from "hono";
import { handle, streamHandle } from "hono/aws-lambda";
import { contextStorage } from "hono/context-storage";
import { showRoutes } from "hono/dev";
import { dbContext } from "../lib/hono";
import { apiRouter } from "./api";

const app = new Hono()
  .use(contextStorage())
  .use(dbContext)
  .route("/api", apiRouter);

showRoutes(app, {
  verbose: true,
});

export const handler: unknown = process.env.SST_LIVE
  ? handle(app)
  : streamHandle(app);

export type AppType = typeof app;
