import { DurableObject } from "cloudflare:workers";
import { createApiContext } from "./context";
import type { apiEnv } from "./env";
import { serverClient } from "./server";

interface SessionAttachment {
  userId: string;
  sessionId: string;
  projectId: string;
  chatId: string;
  organizationId: string;
  url: string;
  chatTitle: string;
}

// Durable Object
export class WebSocketServer extends DurableObject {
  // Keeps track of all WebSocket connections
  // When the DO hibernates, gets reconstructed in the constructor
  sessions: Map<WebSocket, SessionAttachment>;

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
      /^\/api\/realtime\/organization\/([^/]+)\/project\/([^/]+)\/chat\/([^/]+)\/room$/,
    );
    const [_fullMatch, organizationId, projectId, chatId] = matches ?? [];
    if (!organizationId || !projectId || !chatId) {
      console.error(`Invalid URL ${req.url}`);
      return new Response("Invalid URL", { status: 400 });
    }

    const [{ chat }, authDetails] = await Promise.all([
      serverHandler.chat
        .get({
          id: chatId,
          projectId: projectId,
          organizationId: organizationId,
        })
        .catch(() => {
          // if chat not found or org invalid, we just return null
          return { chat: null };
        }),
      serverHandler.auth.session.current(),
    ]);
    if (!chat || !authDetails) {
      console.error(
        `Unauthorized. Missing chat or auth details for ${req.url}`,
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
      projectId: chat.projectId,
      chatId: chat.id,
      organizationId: chat.organizationId,
      url: url.toString(),
      chatTitle: chat.title,
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

  webSocketMessage(ws: WebSocket, message: ArrayBuffer | string) {
    // Get the session associated with the WebSocket connection.
    const session = this.sessions.get(ws);
    if (!session) {
      console.error("[Websocket Server] session is undefined");
      ws.close(1008, "Websocket Server is closing WebSocket");
      return;
    }
    console.log("[Websocket Server] received message", message, typeof message);
    const _context = createApiContext({
      url: new URL(session.url),
    });
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
      `[Websocket Server] WebSocket for user ${session.userId} on chat ${session.chatId} ${wasClean ? "cleanly" : "abruptly"} closed (${code}): ${reason}`,
    );
    this.sessions.delete(ws);
    ws.close(code, "Websocket Server is closing WebSocket");
  }
}
