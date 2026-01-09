import type { LoroDocMapping } from "@rectangular-labs/core/loro-file-system";
import { LoroDoc } from "loro-crdt";
import { CrdtType } from "loro-protocol";
import { getOrCreateRoomDocument } from "../websocket/get-or-create-room-document";
import { WORKSPACE_CONTENT_ROOM_ID } from "./constants";

export async function withLoroTree<TResult>({
  handler,
  shouldPersist,
}: {
  handler: (args: { tree: LoroDocMapping["fs"] }) => TResult | Promise<TResult>;
  shouldPersist: boolean | ((result: TResult) => boolean);
}): Promise<TResult> {
  const roomResult = await getOrCreateRoomDocument(
    WORKSPACE_CONTENT_ROOM_ID,
    CrdtType.Loro,
  );
  if (!roomResult.ok) {
    throw roomResult.error;
  }
  const roomDoc = roomResult.value;
  const loroDoc = loadDocFromRoom(roomDoc.data);
  const tree = getFsRoot(loroDoc);

  const result = await handler({ tree });

  const persist =
    typeof shouldPersist === "boolean" ? shouldPersist : shouldPersist(result);

  if (persist) {
    roomDoc.data = loroDoc.export({ mode: "snapshot" });
    roomDoc.dirty = true;
  }

  return result;
}

function loadDocFromRoom(data: Uint8Array): LoroDoc<LoroDocMapping> {
  const doc = new LoroDoc<LoroDocMapping>();
  if (data.byteLength > 0) {
    doc.import(data);
  }
  return doc;
}

function getFsRoot(doc: LoroDoc<LoroDocMapping>) {
  const tree = doc.getTree("fs");
  return tree;
}
