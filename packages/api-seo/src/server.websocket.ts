import { DurableObject } from "cloudflare:workers";
import { AsyncLocalStorage } from "node:async_hooks";
import { createWebSocketRpcHandler } from "@rectangular-labs/api-core/lib/handlers";
import { decode, type HexString } from "loro-protocol";
import { createApiContext } from "./context";
import type { apiEnv } from "./env";
import { websocketRouter } from "./routes";
import { handleLoroMessage } from "./routes/campaign.loro";
import { serverClient } from "./server";
import type { RoomDocument, UserFragment, WebSocketContext } from "./types";

const webSocketHandler = createWebSocketRpcHandler(websocketRouter);
const asyncLocalStorage = new AsyncLocalStorage<WebSocketContext>();

interface SessionAttachment {
  userId: string;
  sessionId: string;
  projectId: string;
  campaignId: string;
  organizationId: string;
  url: string;
}

// Durable Object
export class WebSocketServer extends DurableObject {
  // Keeps track of all WebSocket connections
  // When the DO hibernates, gets reconstructed in the constructor
  sessions: Map<WebSocket, SessionAttachment>;
  // Keep track of the loro document for the workspace.
  // currently this is the chat document and the content document.
  roomDocuments: Map<string, RoomDocument>;
  // keeps track of the fragments for the user when sending large updates.
  userFragments: Map<WebSocket, Map<HexString, UserFragment>>;

  constructor(ctx: DurableObjectState, env: ReturnType<typeof apiEnv>) {
    super(ctx, env);
    this.sessions = new Map();
    console.log("[Websocket Server] constructing websocket server");

    // As part of constructing the Durable Object,
    // we wake up any hibernating WebSockets and
    // place them back in the `sessions` map.

    // Get all WebSocket connections from the DO
    this.ctx.getWebSockets().forEach((ws) => {
      const attachment = ws.deserializeAttachment();
      console.log("attachment", attachment);
      if (attachment) {
        // If we previously attached state to our WebSocket,
        // let's add it to `sessions` map to restore the state of the connection.
        this.sessions.set(ws, { ...attachment });
      }
    });

    this.roomDocuments = new Map();
    this.userFragments = new Map();

    // Sets an application level auto response that does not wake hibernated WebSockets.
    this.ctx.setWebSocketAutoResponse(
      new WebSocketRequestResponsePair("ping", "pong"),
    );
  }

  /**
   * Sets up a new WebSocket connection for a given client
   * @param req - The request object
   * @returns A response object with the WebSocket client and server
   */
  async fetch(req: Request): Promise<Response> {
    const upgradeHeader = req.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", {
        status: 426,
      });
    }

    if (req.method !== "GET") {
      return new Response("Method not allowed", {
        status: 405,
      });
    }

    // validate that user is allowed to connect
    const url = new URL(req.url);
    const context = createApiContext({
      url: url,
      reqHeaders: req.headers,
    });
    const serverHandler = serverClient(context);
    const matches = url.pathname.match(
      /^\/api\/realtime\/organization\/([^/]+)\/project\/([^/]+)\/campaign\/([^/]+)\/room$/,
    );
    const [_fullMatch, organizationId, projectId, campaignId] = matches ?? [];
    if (!organizationId || !projectId || !campaignId) {
      console.error(`Invalid URL ${req.url}`);
      return new Response("Invalid URL", { status: 400 });
    }

    const [{ campaign }, authDetails] = await Promise.all([
      serverHandler.campaign
        .get({
          id: campaignId,
          projectId: projectId,
          organizationId: organizationId,
        })
        .catch(() => {
          // if campaign not found or org invalid, we just return null
          return { campaign: null };
        }),
      serverHandler.auth.session.current(),
    ]);
    if (!campaign || !authDetails) {
      console.error(
        `Unauthorized. Missing campaign or auth details for ${req.url}`,
      );
      return new Response("Unauthorized", { status: 401 });
    }

    // Creates two ends of a WebSocket connection.
    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);
    if (!server) {
      console.error("BAD STATE: websocket server is undefined");
      return new Response("Internal Server Error", { status: 500 });
    }

    // This allows cloudflare DO hibernation for the websocket connection.
    this.ctx.acceptWebSocket(server);

    // Create the session details for the particular websocket connection.
    const attachment: SessionAttachment = {
      sessionId: authDetails.session.id,
      userId: authDetails.user.id,
      projectId: campaign.projectId,
      campaignId: campaign.id,
      organizationId: campaign.organizationId,
      url: url.toString(),
    };
    // Attach the session ID to the WebSocket connection and serialize it.
    // This is necessary to restore the state of the connection when the Durable Object wakes up.
    server.serializeAttachment(attachment);

    // Add the WebSocket connection to the map of active sessions.
    this.sessions.set(server, attachment);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  async webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    // Get the session associated with the WebSocket connection.
    const session = this.sessions.get(ws);
    if (!session) {
      console.error("[Websocket Server] session is undefined");
      ws.close(1008, "Websocket Server is closing WebSocket");
      return;
    }
    console.log("[Websocket Server] received message", message, typeof message);
    const context = createApiContext({
      url: new URL(session.url),
    });

    let userFragments = this.userFragments.get(ws);
    if (!userFragments) {
      userFragments = new Map();
      this.userFragments.set(ws, userFragments);
    }
    const webSocketContext: WebSocketContext = {
      allWebSockets: Array.from(this.sessions.keys()),
      senderWebSocket: ws,
      userId: session.userId,
      sessionId: session.sessionId,
      projectId: session.projectId,
      campaignId: session.campaignId,
      organizationId: session.organizationId,
      roomDocumentMap: this.roomDocuments,
      userFragments,
      ...context,
    };
    if (typeof message === "string") {
      return await webSocketHandler.message(ws, message, {
        context: webSocketContext,
      });
    }

    // loro messages are binary
    const uintArray = new Uint8Array(message);
    const loroMessage = decode(uintArray);
    await asyncLocalStorage.run(webSocketContext, () =>
      handleLoroMessage({
        message: loroMessage,
      }),
    );
  }

  webSocketClose(
    ws: WebSocket,
    code: number,
    reason: string,
    wasClean: boolean,
  ) {
    const session = this.sessions.get(ws);
    if (!session) {
      console.error("[Websocket Server] session is undefined");
      return;
    }
    console.info(
      `[Websocket Server] WebSocket for user ${session.userId} on campaign ${session.campaignId} ${wasClean ? "cleanly" : "abruptly"} closed (${code}): ${reason}`,
    );
    this.sessions.delete(ws);
    ws.close(code, "Websocket Server is closing WebSocket");
  }
}
