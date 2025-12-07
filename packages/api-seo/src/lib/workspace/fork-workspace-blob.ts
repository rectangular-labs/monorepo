import type { DB } from "@rectangular-labs/db";
import { updateContentCampaign } from "@rectangular-labs/db/operations";
import { LoroDoc } from "loro-crdt";
import type { InitialContext } from "../../types";

/**
 * Forks a workspace blob and updates the campaign with the new workspace blob URI.
 * This is used when a new campaign is created and we need to fork the main workspace blob.
 * @param blob - The main workspace blob
 * @param newWorkspaceBlobUri - The new workspace blob URI
 * @returns The forked buffer
 */
export async function forkAndUpdateWorkspaceBlob({
  blob,
  newWorkspaceBlobUri,
  campaignId,
  projectId,
  organizationId,
  db,
  workspaceBucket,
}: {
  blob: Uint8Array;
  newWorkspaceBlobUri: string;
  campaignId: string;
  projectId: string;
  organizationId: string;
  db: DB;
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

  await updateContentCampaign({
    db,
    values: {
      id: campaignId,
      projectId,
      organizationId,
      workspaceBlobUri: newWorkspaceBlobUri,
    },
  });
  return forkedBuffer;
}
