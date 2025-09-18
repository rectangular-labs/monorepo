import { createRouterClient } from "@orpc/server";
import {
  createOpenAPIHandler,
  createRpcHandler,
} from "@rectangular-labs/api-core/lib/handlers";
import { createApiContext } from "./context";
import { router } from "./routes";

export const serverClient = (context: Parameters<typeof createApiContext>[0]) =>
  createRouterClient(router, {
    context: () => createApiContext(context),
  });

export const RpcHandler = createRpcHandler(router);

export const openAPIHandler = (apiUrl: string) =>
  createOpenAPIHandler({
    router,
    openApiOptions: {
      specGenerateOptions: {
        info: {
          title: "Basic ORPC Open API",
          version: "0.0.0",
        },
        servers: [{ url: apiUrl }],
        commonSchemas: {
          UndefinedError: { error: "UndefinedError" },
        },
      },
    },
  });
