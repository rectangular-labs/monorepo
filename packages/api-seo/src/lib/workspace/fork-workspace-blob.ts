import { LoroDoc } from "loro-crdt";
import type { InitialContext } from "../../types";

/**
 * Forks a workspace blob and stores it at the new workspace blob URI.
 * @param blob - The main workspace blob
 * @param newWorkspaceBlobUri - The new workspace blob URI
 * @returns The forked buffer
 */
export async function forkAndUpdateWorkspaceBlob({
  blob,
  newWorkspaceBlobUri,
  workspaceBucket,
}: {
  blob: Uint8Array;
  newWorkspaceBlobUri: string;
  workspaceBucket: InitialContext["workspaceBucket"];
}): Promise<Uint8Array> {
  const doc = new LoroDoc();
  doc.import(blob);
  const forkedDoc = doc.fork();

  const forkedBuffer = forkedDoc.export({
    mode: "shallow-snapshot",
    frontiers: doc.oplogFrontiers(),
  });

  await workspaceBucket.setSnapshot(newWorkspaceBlobUri, forkedBuffer);
  return forkedBuffer;
}
