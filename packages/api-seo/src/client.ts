import { createORPCClient } from "@orpc/client";
import {
  createOpenApiLink,
  createRpcLink,
  createWebsocketLink,
} from "@rectangular-labs/api-core/lib/links";
import contract from "./_open-api/orpc-contract.json";
import type { Router, RouterClient, WebsocketRouterClient } from "./types";

export { eventIteratorToUnproxiedDataStream } from "@orpc/client";
export { createTanstackQueryUtils } from "@orpc/tanstack-query";
export { getExtensionFromMimeType } from "./lib/project/get-extension-from-mimetype";
export { getImageFileNameFromUri } from "./lib/project/get-image-file-name-from-uri";
export { getMimeTypeFromFileName } from "./lib/project/get-mimetype-from-filename";
export { getWorkspaceBlobUri } from "./lib/workspace/get-workspace-blob-uri";

export const rpcClient = (baseUrl: string): RouterClient =>
  createORPCClient(createRpcLink({ baseUrl, path: "/api/rpc" }));
export const websocketClient = (websocket: WebSocket): WebsocketRouterClient =>
  createORPCClient(createWebsocketLink({ websocket }));
export const openApiClient = (baseUrl: string): RouterClient =>
  createORPCClient(
    createOpenApiLink({
      contract: contract as unknown as Router,
      baseUrl,
      path: "/api",
    }),
  );
