import { createChatMessage } from "@rectangular-labs/db/operations";
import { err, ok } from "@rectangular-labs/result";
import { getWebsocketContext } from "../../context";
import type { SeoChatMessage } from "../../types";
import { broadcastMessageToRoom } from "./broadcast-to-room";

export async function handleWebsocketMessage({
  message,
  broadcast = false,
  userId,
}: {
  message: SeoChatMessage;
  userId: string | null;
  broadcast?: boolean;
}) {
  const context = getWebsocketContext();

  const messageResult = await createChatMessage({
    db: context.db,
    value: {
      ...(message.id ? { id: message.id } : {}),
      organizationId: context.organizationId,
      projectId: context.projectId,
      chatId: context.campaignId,
      userId,
      message: message.parts,
      source: message.role,
    },
  });
  if (!messageResult.ok) {
    return err(messageResult.error);
  }
  if (broadcast) {
    broadcastMessageToRoom(
      {
        type: "new-msg",
        message: {
          id: messageResult.value.id,
          role: message.role,
          parts: message.parts,
          metadata: {
            sentAt: messageResult.value.createdAt.toISOString(),
            userId: messageResult.value.userId,
          },
        },
      },
      true,
    );
  }
  return ok(messageResult.value);
}
