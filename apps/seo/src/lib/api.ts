import {
  createTanstackQueryUtils,
  rpcClient,
  websocketClient,
} from "@rectangular-labs/api-seo/client";
import { serverClient } from "@rectangular-labs/api-seo/server";
import { createIsomorphicFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

export const getApiClient = createIsomorphicFn()
  .server(() => {
    const request = getRequest();
    const client = serverClient({
      url: new URL(request.url),
      // The request isn't populated in the server context, so we need to pass it in manually
      reqHeaders: request.headers,
      resHeaders: new Headers(),
    });
    return client;
  })
  .client(() => {
    const client = rpcClient(window.location.origin);
    return client;
  });
export const getApiClientRq = () => createTanstackQueryUtils(getApiClient());

export const getWebsocketClient = createIsomorphicFn()
  .server(() => {
    const request = getRequest();
    const websocket = new WebSocket(
      new URL(request.url).protocol === "https:"
        ? request.url.replace("https", "wss")
        : request.url.replace("http", "ws"),
    );
    return websocketClient(websocket);
  })
  .client(() => {
    const client = websocketClient(
      window.location.protocol === "https:"
        ? new WebSocket(window.location.origin.replace("https", "wss"))
        : new WebSocket(window.location.origin.replace("http", "ws")),
    );
    return client;
  });
