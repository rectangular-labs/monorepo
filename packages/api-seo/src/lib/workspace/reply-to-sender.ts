import { encode, type ProtocolMessage } from "loro-protocol";
import { getWebsocketContext } from "../../context";

export function replyToSender(message: ProtocolMessage) {
  const context = getWebsocketContext();
  const data = encode(message);
  context.senderWebSocket.send(data);
}
