import { experimental_ArkTypeToJsonSchemaConverter as ArkTypeToJsonSchemaConverter } from "@orpc/arktype";
import { SmartCoercionPlugin } from "@orpc/json-schema";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { OpenAPIHandler as NodeOpenAPIHandler } from "@orpc/openapi/node";
import {
  OpenAPIReferencePlugin,
  type OpenAPIReferencePluginOptions,
} from "@orpc/openapi/plugins";
import type { Context, Router } from "@orpc/server";
import { onError } from "@orpc/server";
import { RPCHandler } from "@orpc/server/fetch";
import { RPCHandler as NodeRpcHandler } from "@orpc/server/node";
import {
  CORSPlugin,
  RequestHeadersPlugin,
  ResponseHeadersPlugin,
} from "@orpc/server/plugins";
import type { StandardHandlerOptions } from "@orpc/server/standard";
import { RPCHandler as WebSocketRPCHandler } from "@orpc/server/websocket";

const corsPlugin = new CORSPlugin({
  origin: (origin) => {
    const rectangularLabsRegex =
      /^https:\/\/(?:preview\.|pr-\d+\.|www\.)?rectangularlabs\.com/;
    const fluidpostsRegex =
      /^https:\/\/(?:preview\.|pr-\d+\.|www\.)?fluidposts\.com/;
    const match =
      rectangularLabsRegex.test(origin) || fluidpostsRegex.test(origin);
    if (match) {
      return origin;
    }
    return null;
  },
  allowMethods: ["GET", "HEAD", "POST", "DELETE", "PATCH"],
  credentials: true,
  maxAge: 600,
});

export const createWebSocketRpcHandler = <C extends Context>(
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>,
  interceptors?: StandardHandlerOptions<C>["interceptors"],
) =>
  new WebSocketRPCHandler(router, {
    plugins: [],
    interceptors: interceptors ?? [
      onError((error) => {
        console.error("WebSocket RPC Error:", error);
      }),
    ],
  });

export const createRpcHandler = <C extends Context>(
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>,
  interceptors?: StandardHandlerOptions<C>["interceptors"],
) =>
  new RPCHandler(router, {
    plugins: [
      corsPlugin,
      new RequestHeadersPlugin(),
      new ResponseHeadersPlugin(),
    ],
    interceptors: interceptors ?? [
      onError((error) => {
        console.error("RPC Error:", error);
      }),
    ],
  });

export const createNodeRpcHandler = <C extends Context>(
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>,
  interceptors?: StandardHandlerOptions<C>["interceptors"],
) =>
  new NodeRpcHandler(router, {
    plugins: [
      corsPlugin,
      new RequestHeadersPlugin(),
      new ResponseHeadersPlugin(),
    ],
    interceptors: interceptors ?? [
      onError((error) => {
        console.error("RPC Error:", error);
      }),
    ],
  });

export const createOpenAPIHandler = <C extends Context>({
  router,
  openApiOptions = {},
  interceptors,
}: {
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>;
  openApiOptions?: OpenAPIReferencePluginOptions<C>;
  interceptors?: StandardHandlerOptions<C>["interceptors"];
}) =>
  new OpenAPIHandler(router, {
    interceptors: interceptors ?? [
      onError((error) => {
        console.error("OpenAPI Error:", error);
      }),
    ],
    plugins: [
      corsPlugin,
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

export const createNodeOpenAPIHandler = <C extends Context>({
  router,
  openApiOptions = {},
}: {
  // biome-ignore lint/suspicious/noExplicitAny: User defined router
  router: Router<any, C>;
  openApiOptions?: OpenAPIReferencePluginOptions<C>;
}) =>
  new NodeOpenAPIHandler(router, {
    interceptors: [
      onError((error) => {
        console.error("OpenAPI Error:", error);
      }),
    ],
    plugins: [
      corsPlugin,
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
