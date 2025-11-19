import { getContentCampaignById } from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { LoroServerAdaptor } from "loro-adaptors";
import { CrdtType } from "loro-protocol";
import { getWebsocketContext } from "../../context";
import type { RoomDocument } from "../../types";
import { WORKSPACE_CONTENT_ROOM_ID } from "./constants";

function getRoomKey(
  roomId: typeof WORKSPACE_CONTENT_ROOM_ID,
  crdtType: CrdtType,
): string {
  return `${roomId}:${crdtType}`;
}

/**
 * This function gets or creates the room document for the given room ID and CRDT type.
 * The roomDocument object is passed from the durable object by reference so should theoretically cache the document in the durable object after the first fetch.
 * @param roomId - The room ID
 * @param crdtType - The CRDT type
 * @returns A result containing the room document or an error
 */
export async function getOrCreateRoomDocument(
  roomId: typeof WORKSPACE_CONTENT_ROOM_ID,
  crdtType: CrdtType,
): Promise<Result<RoomDocument, Error>> {
  const roomKey = getRoomKey(roomId, crdtType);
  const context = getWebsocketContext();

  const roomDoc = context.roomDocumentMap.get(roomKey);
  if (roomDoc) {
    console.log(`Room document (${roomKey}) found in cache`);
    return ok(roomDoc);
  }

  // TODO: handle different CRDT types here.
  const newRoomDoc: RoomDocument = {
    data: new Uint8Array(),
    dirty: false,
    lastSaved: Date.now(),
    descriptor: {
      shouldPersist: true,
      allowBackfillWhenNoOtherClients: false,
      adaptor: new LoroServerAdaptor(),
    },
  };
  const campaignResult = await getContentCampaignById({
    db: context.db,
    id: context.campaignId,
    projectId: context.projectId,
    organizationId: context.organizationId,
  });
  if (!campaignResult.ok) {
    return campaignResult;
  }
  const campaign = campaignResult.value;
  if (!campaign) {
    return err(new Error(`Campaign (${context.campaignId}) not found`));
  }

  if (roomKey === getRoomKey(WORKSPACE_CONTENT_ROOM_ID, CrdtType.Loro)) {
    // TODO: handle the case where we haven't yet forked the workspace blob from main.
    const blob = await context.workspaceBucket.getSnapshot(
      campaign.workspaceBlobUri,
    );
    if (!blob) {
      return err(
        new Error(`Workspace blob (${campaign.workspaceBlobUri}) not found`),
      );
    }
    newRoomDoc.data = blob;
  } else {
    return err(new Error(`Unsupported room key: ${roomKey}`));
  }

  context.roomDocumentMap.set(roomKey, newRoomDoc);
  return ok(newRoomDoc);
}
export {
  broadcastLoroToRoom,
  broadcastMessageToRoom,
} from "./broadcast-to-room";
export { WORKSPACE_CONTENT_ROOM_ID } from "./constants";
export { getWorkspaceBlobUri } from "./get-workspace-blob-uri";
export { replyToSender } from "./reply-to-sender";
