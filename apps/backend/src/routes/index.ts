import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
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

export const handler = handle(app);

export type AppType = typeof app;
