import type { CrdtType } from "loro-protocol";
import type { WORKSPACE_CONTENT_ROOM_ID } from "../workspace/constants";

export function getRoomKey(
  roomId: typeof WORKSPACE_CONTENT_ROOM_ID,
  crdtType: CrdtType,
): string {
  return `${roomId}:${crdtType}`;
}
