import { encode, type ProtocolMessage } from "loro-protocol";
import { getWebsocketContext } from "../../context";
import { sendWebsocketMessage } from "./send-websocket-message";

export function replyToSender(message: ProtocolMessage) {
  const context = getWebsocketContext();
  const data = encode(message);
  sendWebsocketMessage(context.senderWebSocket, data);
}
