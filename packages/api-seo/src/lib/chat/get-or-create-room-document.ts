import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import { getContentCampaignById } from "@rectangular-labs/db/operations";
import { err, ok, type Result } from "@rectangular-labs/result";
import { LoroServerAdaptor } from "loro-adaptors/loro";
import { CrdtType } from "loro-protocol";
import { getWebsocketContext } from "../../context";
import type { RoomDocument } from "../../types";
import { WORKSPACE_CONTENT_ROOM_ID } from "../workspace/constants";
import { forkAndUpdateWorkspaceBlob } from "../workspace/fork-workspace-blob";
import { getRoomKey } from "./get-room-key";

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
  // Right now this only handles Loro CRDTs and persistent ephemeral CRDTs.
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

  const campaignResult = await (async () => {
    if (!context.campaignId) {
      return ok({
        workspaceBlobUri: getWorkspaceBlobUri({
          orgId: context.organizationId,
          projectId: context.projectId,
          campaignId: undefined,
        }),
      });
    }

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
    return ok(campaign);
  })();
  if (!campaignResult.ok) {
    return campaignResult;
  }
  const campaign = campaignResult.value;

  switch (roomKey) {
    case getRoomKey(WORKSPACE_CONTENT_ROOM_ID, CrdtType.Loro): {
      const campaignWorkspaceBlobUri = getWorkspaceBlobUri({
        orgId: context.organizationId,
        projectId: context.projectId,
        campaignId: context.campaignId,
      });
      const blob = await context.workspaceBucket.getSnapshot(
        campaign.workspaceBlobUri,
      );
      if (!blob) {
        return err(
          new Error(`Workspace blob (${campaign.workspaceBlobUri}) not found`),
        );
      }
      if (campaign.workspaceBlobUri !== campaignWorkspaceBlobUri) {
        // still on main blob, fork and update
        const forkedBuffer = await forkAndUpdateWorkspaceBlob({
          blob,
          newWorkspaceBlobUri: campaignWorkspaceBlobUri,
          campaignId: context.campaignId,
          projectId: context.projectId,
          organizationId: context.organizationId,
          db: context.db,
          workspaceBucket: context.workspaceBucket,
        });
        newRoomDoc.data = forkedBuffer;
        newRoomDoc.lastSaved = Date.now();
      } else {
        newRoomDoc.data = blob;
      }
      context.roomDocumentMap.set(roomKey, newRoomDoc);
      return ok(newRoomDoc);
    }
    default: {
      return err(new Error(`Unsupported room key: ${roomKey}`));
    }
  }
}
