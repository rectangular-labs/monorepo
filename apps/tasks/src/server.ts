import { createRpcHandler } from "@rectangular-labs/api-core/lib/handlers";
import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { createApiContext } from "./context";
import { router } from "./routes";

const rpcHandler = createRpcHandler(router);

const app = new Hono();
app.use("/*", async (c, next) => {
  const { matched, response } = await rpcHandler.handle(c.req.raw, {
    prefix: "/rpc",
    context: createApiContext({
      url: new URL(c.req.raw.url),
      reqHeaders: c.req.raw.headers,
    }),
  });

  if (matched) {
    return c.newResponse(response.body, response);
  }

  return await next();
});

export const handler = handle(app);
