import { encode, type ProtocolMessage } from "loro-protocol";
import { getWebsocketContext } from "../../context";
import type { WebSocketMessages } from "../../types";
import { sendWebsocketMessage } from "./send-websocket-message";

export function broadcastLoroToRoom(
  message: ProtocolMessage,
  excludeSender: boolean = true,
) {
  const context = getWebsocketContext();
  const data = encode(message);
  for (const ws of context.allWebSockets) {
    if (excludeSender && ws === context.senderWebSocket) continue;
    sendWebsocketMessage(ws, data);
  }
}

export function broadcastMessageToRoom(
  message: WebSocketMessages,
  excludeSender: boolean = true,
) {
  const context = getWebsocketContext();
  for (const ws of context.allWebSockets) {
    if (excludeSender && ws === context.senderWebSocket) continue;
    sendWebsocketMessage(ws, JSON.stringify(message));
  }
}
