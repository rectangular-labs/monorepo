import { RPCLink } from "@orpc/client/fetch";
import { RPCLink as WebSocketRPCLink } from "@orpc/client/websocket";
import type { AnyContractRouter } from "@orpc/contract";
import { OpenAPILink } from "@orpc/openapi-client/fetch";
import { onError } from "@orpc/server";

export const createRpcLink = ({
  baseUrl,
  path = "/api/rpc",
}: {
  baseUrl: string;
  path?: `/${string}`;
}) =>
  new RPCLink({
    url: `${baseUrl}${path}`,
    method: ({ context }, path) => {
      // Use GET for cached responses
      if (context?.cache) {
        return "GET";
      }

      // Use GET for read-like operations
      if (path.at(-1)?.match(/^(?:get|find|list|search)(?:[A-Z].*)?$/)) {
        return "GET";
      }

      return "POST";
    },
    fetch(request, init) {
      return globalThis.fetch(request, {
        ...init,
        credentials: "include", // Include cookies for cross-origin requests
      });
    },
  });

export const createWebsocketLink = ({ websocket }: { websocket: WebSocket }) =>
  new WebSocketRPCLink({ websocket });

export const createOpenApiLink = ({
  contract,
  baseUrl,
  path = "/api",
}: {
  contract: AnyContractRouter;
  baseUrl: string;
  path?: string;
}) =>
  new OpenAPILink(contract, {
    url: `${baseUrl}${path}`,
    headers: () => ({}),
    fetch: (request, init) => {
      return globalThis.fetch(request, {
        ...init,
        credentials: "include", // Include cookies for cross-origin requests
      });
    },
    interceptors: [
      onError((error) => {
        console.error(error);
      }),
    ],
  });
