import { updateContentCampaign } from "@rectangular-labs/db/operations";
import { LoroDoc } from "loro-crdt";
import { getWebsocketContext } from "../../context";

/**
 * Forks a workspace blob and updates the campaign with the new workspace blob URI.
 * This is used when a new campaign is created and we need to fork the main workspace blob.
 * @param blob - The main workspace blob
 * @param newWorkspaceBlobUri - The new workspace blob URI
 * @returns The forked buffer
 */
export async function forkAndUpdateWorkspaceBlob(
  blob: Uint8Array,
  newWorkspaceBlobUri: string,
): Promise<Uint8Array> {
  const context = getWebsocketContext();

  const doc = new LoroDoc();
  doc.import(blob);
  const forkedDoc = doc.fork();

  const forkedBuffer = forkedDoc.export({
    mode: "shallow-snapshot",
    frontiers: doc.oplogFrontiers(),
  });

  await context.workspaceBucket.setSnapshot(newWorkspaceBlobUri, forkedBuffer);

  await updateContentCampaign({
    db: context.db,
    values: {
      id: context.campaignId,
      projectId: context.projectId,
      organizationId: context.organizationId,
      workspaceBlobUri: newWorkspaceBlobUri,
    },
  });
  return forkedBuffer;
}
