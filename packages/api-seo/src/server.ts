import { createRouterClient, onError } from "@orpc/server";
import {
  createOpenAPIHandler,
  createRpcHandler,
} from "@rectangular-labs/api-core/lib/handlers";
import { type } from "arktype";
import { createApiContext } from "./context";
import { router } from "./routes";

export const serverClient = (context: Parameters<typeof createApiContext>[0]) =>
  createRouterClient(router, {
    context: () => createApiContext(context),
  });

export const RpcHandler = createRpcHandler(router, [
  onError((error) => {
    console.error(
      "RPC Error:",
      error instanceof type.errors ? error.summary : error,
    );
  }),
]);

export const openAPIHandler = (apiUrl: string) =>
  createOpenAPIHandler({
    router,
    interceptors: [
      onError((error) => {
        console.error(
          "OpenAPI Error:",
          error instanceof type.errors ? error.summary : error,
        );
      }),
    ],
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
