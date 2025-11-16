import { encode, type ProtocolMessage } from "loro-protocol";
import { getWebsocketContext } from "../../context";

export function broadcastToRoom(
  message: ProtocolMessage,
  excludeSender: boolean = true,
) {
  const context = getWebsocketContext();
  const data = encode(message);
  for (const ws of context.allWebSockets) {
    if (excludeSender && ws === context.senderWebSocket) continue;
    ws.send(data);
  }
}
