import { createORPCClient } from "@orpc/client";
import {
  createOpenApiLink,
  createRpcLink,
  createWebsocketLink,
} from "@rectangular-labs/api-core/lib/links";
import contract from "./_open-api/orpc-contract.json";
import type { Router, RouterClient } from "./types";

export { eventIteratorToUnproxiedDataStream } from "@orpc/client";
export const rpcClient = (baseUrl: string): RouterClient =>
  createORPCClient(createRpcLink({ baseUrl, path: "/api/rpc" }));

export const websocketClient = (websocket: WebSocket): RouterClient =>
  createORPCClient(createWebsocketLink({ websocket }));

export { createTanstackQueryUtils } from "@orpc/tanstack-query";

export const openApiClient = (baseUrl: string): RouterClient =>
  createORPCClient(
    createOpenApiLink({
      contract: contract as unknown as Router,
      baseUrl,
      path: "/api",
    }),
  );
