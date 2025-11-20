import { err, ok, safeSync, type Result } from "@rectangular-labs/result";
import {
  type DocUpdate,
  type DocUpdateFragment,
  type DocUpdateFragmentHeader,
  JoinErrorCode,
  type JoinRequest,
  MAX_MESSAGE_SIZE,
  MessageType,
  type ProtocolMessage,
  UpdateErrorCode,
} from "loro-protocol";
import { getWebsocketContext } from "../context";
import {
  broadcastLoroToRoom,
  getOrCreateRoomDocument,
  replyToSender,
  WORKSPACE_CONTENT_ROOM_ID,
} from "../lib/workspace";

export async function handleLoroMessage({
  message,
}: {
  message: ProtocolMessage;
}) {
  switch (message.type) {
    case MessageType.JoinRequest: {
      const joinResult = await handleJoinRequest(message);
      if (!joinResult.ok) {
        replyToSender({
          type: MessageType.JoinError,
          crdt: message.crdt,
          roomId: message.roomId,
          code: JoinErrorCode.Unknown,
          message: joinResult.error.message,
        });
      }
      break;
    }
    case MessageType.DocUpdate: {
      const docUpdateResult = await handleDocUpdate(message);
      if (!docUpdateResult.ok) {
        replyToSender({
          type: MessageType.UpdateError,
          crdt: message.crdt,
          roomId: message.roomId,
          code: UpdateErrorCode.InvalidUpdate,
          message: docUpdateResult.error.message,
        });
      }
      break;
    }
    case MessageType.DocUpdateFragmentHeader:
      handleFragmentHeader(message);
      break;
    case MessageType.DocUpdateFragment: {
      const fragmentResult = await handleFragment(message);
      if (!fragmentResult.ok) {
        replyToSender({
          type: MessageType.UpdateError,
          crdt: message.crdt,
          roomId: message.roomId,
          code: UpdateErrorCode.InvalidUpdate,
          message: fragmentResult.error.message,
        });
      }
      break;
    }
    case MessageType.Leave: {
      break;
    }
    default:
      throw new Error(`Unsupported message type: ${message.type}`);
  }
}

async function handleJoinRequest(
  message: JoinRequest,
): Promise<Result<void, Error>> {
  if (message.roomId !== WORKSPACE_CONTENT_ROOM_ID) {
    return err(new Error(`Unsupported room ID: ${message.roomId}`));
  }
  const roomDocResult = await getOrCreateRoomDocument(
    message.roomId,
    message.crdt,
  );
  if (!roomDocResult.ok) {
    return roomDocResult;
  }
  const roomDoc = roomDocResult.value;
  const joinResult = roomDoc.descriptor.adaptor.handleJoinRequest(
    roomDoc.data,
    message.version,
  );

  // Send join response with current document version
  replyToSender({
    ...joinResult.response,
    crdt: message.crdt,
    roomId: message.roomId,
  });

  // Backfill: send the updates the client is missing so it can
  // catch up from its known version to the room’s current state.
  // For Loro this is a delta from the VersionVector; for ELO this
  // is an encrypted container selection; for Ephemeral it's current state.
  const websocketContext = getWebsocketContext();
  const hasOthers = websocketContext.allWebSockets.length > 1;
  const shouldBackfill =
    (hasOthers || roomDoc.descriptor.allowBackfillWhenNoOtherClients) &&
    joinResult.updates?.length;
  if (shouldBackfill && joinResult.updates) {
    for (const u of joinResult.updates) {
      replyToSender({
        type: MessageType.DocUpdate,
        crdt: message.crdt,
        roomId: message.roomId,
        updates: [u],
      });
    }
  }

  return ok(undefined);
}

async function handleDocUpdate(
  message: DocUpdate,
): Promise<Result<void, Error>> {
  // Guard: reject payloads that exceed max update size
  // (Clients fragment large updates; this is a safety net.)
  const oversized = message.updates.some((u) => u.length > MAX_MESSAGE_SIZE);
  if (oversized) {
    replyToSender({
      type: MessageType.UpdateError,
      crdt: message.crdt,
      roomId: message.roomId,
      code: UpdateErrorCode.PayloadTooLarge,
      message: `Update payload exceeds ${MAX_MESSAGE_SIZE} bytes`,
    });
    return ok(undefined);
  }
  if (message.roomId !== WORKSPACE_CONTENT_ROOM_ID) {
    return err(new Error(`Unsupported room ID: ${message.roomId}`));
  }

  const roomDocResult = await getOrCreateRoomDocument(
    message.roomId,
    message.crdt,
  );
  if (!roomDocResult.ok) {
    return roomDocResult;
  }

  const roomDoc = roomDocResult.value;
  const newDocumentData = safeSync(() =>
    roomDoc.descriptor.adaptor.applyUpdates(roomDoc.data, message.updates),
  );
  if (!newDocumentData.ok) {
    return newDocumentData;
  }
  roomDoc.data = newDocumentData.value;

  if (roomDoc.descriptor.shouldPersist) {
    roomDoc.dirty = true;
  }

  const updatesForBroadcast = message.updates;
  if (updatesForBroadcast.length > 0) {
    const outgoing: DocUpdate = {
      type: MessageType.DocUpdate,
      crdt: message.crdt,
      roomId: message.roomId,
      updates: updatesForBroadcast,
    };
    broadcastLoroToRoom(outgoing);
  }
  return ok(undefined);
}

function handleFragmentHeader(message: DocUpdateFragmentHeader): void {
  const context = getWebsocketContext();
  context.userFragments.set(message.batchId, {
    data: Array.from({ length: message.fragmentCount }),
    totalSize: message.totalSizeBytes,
    received: 0,
    header: message,
  });
  setTimeout(() => {
    context.userFragments.delete(message.batchId);
  }, 30_000); // 30 seconds
}

async function handleFragment(
  message: DocUpdateFragment,
): Promise<Result<void, Error>> {
  const context = getWebsocketContext();
  const batch = context.userFragments.get(message.batchId);
  if (!batch) {
    replyToSender({
      type: MessageType.UpdateError,
      crdt: message.crdt,
      roomId: message.roomId,
      code: UpdateErrorCode.FragmentTimeout,
      message: "Fragment batch not found",
      batchId: message.batchId,
    });
    return ok(undefined);
  }

  batch.data[message.index] = message.fragment;
  batch.received++;

  if (message.roomId !== WORKSPACE_CONTENT_ROOM_ID) {
    return err(new Error(`Unsupported room ID: ${message.roomId}`));
  }

  // Check if all fragments received
  if (batch.received === batch.data.length) {
    // Reconstruct the complete update
    const totalData = new Uint8Array(batch.totalSize);
    let offset = 0;

    for (const fragment of batch.data) {
      totalData.set(fragment, offset);
      offset += fragment.length;
    }

    // Apply to server-side CRDT state
    const roomDocResult = await getOrCreateRoomDocument(
      message.roomId,
      message.crdt,
    );
    if (!roomDocResult.ok) {
      return roomDocResult;
    }

    const roomDoc = roomDocResult.value;
    const newDocumentData = safeSync(() =>
      roomDoc.descriptor.adaptor.applyUpdates(roomDoc.data, [totalData]),
    );
    if (!newDocumentData.ok) {
      return newDocumentData;
    }
    roomDoc.data = newDocumentData.value;

    if (roomDoc.descriptor.shouldPersist) {
      roomDoc.dirty = true;
    }

    // Broadcast original fragments to other clients in the room
    const header = batch.header;
    broadcastLoroToRoom(header);
    const batchDataLength = batch.data.length;
    for (let i = 0; i < batchDataLength; ++i) {
      const fragment = batch.data[i];
      if (!fragment) {
        continue;
      }
      broadcastLoroToRoom({
        type: MessageType.DocUpdateFragment,
        crdt: message.crdt,
        roomId: message.roomId,
        batchId: message.batchId,
        index: i,
        fragment,
      });
    }

    context.userFragments.delete(message.batchId);
  }
  return ok(undefined);
}
