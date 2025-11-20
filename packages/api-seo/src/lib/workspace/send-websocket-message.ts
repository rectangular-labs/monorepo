import { safeSync } from "@rectangular-labs/result";

export function sendWebsocketMessage(
  ws: WebSocket,
  message: string | Uint8Array,
) {
  const wsSendResult = safeSync(() => ws.send(message));
  if (
    !wsSendResult.ok &&
    wsSendResult.error.message.includes(
      "Can't call WebSocket send() after close().",
    )
  ) {
    return;
  }
  if (!wsSendResult.ok) {
    throw wsSendResult.error;
  }
}
