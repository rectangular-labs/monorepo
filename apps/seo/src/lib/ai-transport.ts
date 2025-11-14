import { websocketClient } from "@rectangular-labs/api-seo/client";
import type {
  ChatRequestOptions,
  ChatTransport,
  UIMessage,
  UIMessageChunk,
} from "ai";
import { WebSocket as ReconnectingWebSocket } from "partysocket";

export type SendMessagesParams<UI_MESSAGE extends UIMessage = UIMessage> =
  Parameters<ChatTransport<UI_MESSAGE>["sendMessages"]>[0];

export type WebsocketChatTransportOptions = {
  /** Optional headers for WebSocket connection */
  headers?: Record<string, string>;
  /** WebSocket URL for the agent */
  url: string;
};

/**
 * WebSocket-based chat transport that communicates with AI SDK agents via WebSocket connections.
 *
 * This transport receives the AI SDK's fullStream from the agent and converts it back
 * to a ReadableStream<UIMessageChunk> for the frontend.
 */
export class WebsocketChatTransport<UI_MESSAGE extends UIMessage>
  implements ChatTransport<UI_MESSAGE>
{
  private readonly pendingStreams = new Map<
    string,
    {
      abortController: AbortController;
      controller: ReadableStreamDefaultController<UIMessageChunk>;
    }
  >();
  private ws: null | ReconnectingWebSocket = null;

  constructor(private readonly options: WebsocketChatTransportOptions) {}

  /**
   * Creates a WebSocket connection to the agent
   */
  private async connectWebSocket(): Promise<ReconnectingWebSocket> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return this.ws;
    }

    return await new Promise((resolve, reject) => {
      const ws = new ReconnectingWebSocket(this.options.url);

      ws.onopen = () => {
        this.ws = ws;
        resolve(ws);
      };

      ws.onerror = (error) => {
        reject(new Error(`WebSocket connection failed: ${error}`));
      };

      ws.onmessage = (event) => {
        this.handleWebSocketMessage(event);
      };

      ws.onclose = () => {
        this.ws = null;
        // Reject all pending streams
        for (const [chatId, stream] of this.pendingStreams) {
          stream.controller.error(new Error("WebSocket connection closed"));
          stream.abortController.abort();
        }
        this.pendingStreams.clear();
      };
    });
  }

  /**
   * Handles incoming WebSocket messages from the AI SDK agent
   * The agent sends the fullStream chunks directly, so we just forward them
   */
  private handleWebSocketMessage(event: MessageEvent) {
    console.log("event", event);
    try {
      const data = JSON.parse(event.data);

      // Find the appropriate stream for this message
      // For now, we'll use the first available stream
      // todo: use an id
      const streamEntry = Array.from(this.pendingStreams.values())[0];
      if (!streamEntry) return;

      const { controller } = streamEntry;

      // The agent sends AI SDK fullStream chunks directly
      // We need to convert them to UIMessageChunk format
      const chunk = data as UIMessageChunk;
      if (chunk) {
        controller.enqueue(chunk);
      }

      // handle tool call results
      //   if (data.type === "tool-output-available") {
      //     this.toolCallCallback(data.output);
      //   }

      // Handle completion events
      if (data.type === "finish" || data.type === "error") {
        controller.close();
        // Clean up the stream
        for (const [chatId, stream] of this.pendingStreams) {
          if (stream.controller === controller) {
            this.pendingStreams.delete(chatId);
            break;
          }
        }
      }
    } catch (error) {
      console.error("Error handling WebSocket message:", error);
      // Error all pending streams
      for (const [, stream] of this.pendingStreams) {
        stream.controller.error(error);
      }
      this.pendingStreams.clear();
    }
  }

  /**
   * Closes the WebSocket connection
   */
  close() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    // Clean up all pending streams
    for (const [, stream] of this.pendingStreams) {
      stream.controller.error(new Error("Transport closed"));
    }
    this.pendingStreams.clear();
  }

  /**
   * Reconnects to an existing stream (not fully implemented for WebSocket)
   * WebSocket connections are stateful, so reconnection is handled at the connection level
   */
  async reconnectToStream({
    chatId,
    ...options
  }: {
    chatId: string;
  } & ChatRequestOptions): Promise<null | ReadableStream<UIMessageChunk>> {
    // For WebSocket, we can't easily reconnect to a specific stream
    // since the connection is stateful. This would require server-side
    // support for stream resumption.
    return await Promise.resolve(null);
  }

  /**
   * Sends messages to the agent via WebSocket and returns a stream of UIMessageChunk
   */
  async sendMessages({
    abortSignal,
    chatId,
    messageId,
    messages,
    trigger,
    ...options
  }: {
    abortSignal: AbortSignal | undefined;
    chatId: string;
    messageId: string | undefined;
    messages: UI_MESSAGE[];
    trigger: "regenerate-message" | "submit-message";
  } & ChatRequestOptions): Promise<ReadableStream<UIMessageChunk>> {
    const abortController = new AbortController();

    // Set up abort handling
    if (abortSignal) {
      abortSignal.addEventListener("abort", () => {
        abortController.abort();
        this.pendingStreams.delete(chatId);
      });
    }

    // Create the stream
    const stream = new ReadableStream<UIMessageChunk>({
      cancel: () => {
        this.pendingStreams.delete(chatId);
        abortController.abort();
      },
      start: (controller) => {
        this.pendingStreams.set(chatId, { abortController, controller });
      },
    });

    try {
      // Connect to WebSocket
      const ws = await this.connectWebSocket();

      // Create the AI SDK request
      const request: SendMessagesParams<UI_MESSAGE> = {
        abortSignal,
        chatId,
        messageId,
        messages,
        trigger,
        ...options,
      };

      // Send the message to the agent
      const wsClient = websocketClient(ws as unknown as WebSocket);
      wsClient.campaign.room(request);
    } catch (error) {
      // Clean up on error
      const streamEntry = this.pendingStreams.get(chatId);
      if (streamEntry) {
        streamEntry.controller.error(error);
        this.pendingStreams.delete(chatId);
      }
      throw error;
    }

    return stream;
  }
}
