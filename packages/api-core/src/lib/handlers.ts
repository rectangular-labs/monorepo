import { experimental_ArkTypeToJsonSchemaConverter as ArkTypeToJsonSchemaConverter } from "@orpc/arktype";
import { experimental_SmartCoercionPlugin as SmartCoercionPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import {
  OpenAPIReferencePlugin,
  type OpenAPIReferencePluginOptions,
} from "@orpc/openapi/plugins";
import type { Context, Router } from "@orpc/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import {
  RequestHeadersPlugin,
  ResponseHeadersPlugin,
} from "@orpc/server/plugins";

export const createRpcHandler = <C extends Context>(
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>,
) =>
  new RPCHandler(router, {
    plugins: [new RequestHeadersPlugin(), new ResponseHeadersPlugin()],
    interceptors: [
      onError((error) => {
        console.error("RPC Error:", error);
      }),
    ],
  });

export const createOpenAPIHandler = <C extends Context>({
  router,
  openApiOptions = {},
}: {
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>;
  openApiOptions?: OpenAPIReferencePluginOptions<C>;
}) =>
  new OpenAPIHandler(router, {
    interceptors: [
      onError((error) => {
        console.error("OpenAPI Error:", error);
      }),
    ],
    plugins: [
      new RequestHeadersPlugin(),
      new ResponseHeadersPlugin(),
      new SmartCoercionPlugin({
        schemaConverters: [new ArkTypeToJsonSchemaConverter()],
      }),
      new OpenAPIReferencePlugin({
        schemaConverters: [new ArkTypeToJsonSchemaConverter()],
        docsPath: "/docs",
        specPath: "/openapi.json",
        ...openApiOptions,
      }),
    ],
  });
