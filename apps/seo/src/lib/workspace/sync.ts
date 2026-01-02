import {
  addCreatedAtOnCreateMiddleware,
  addScheduledForWhenPlannedMiddleware,
  type FsNodePayload,
  type LoroDocMapping,
  type WriteToFilePublishingContext,
} from "@rectangular-labs/core/loro-file-system";
import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import {
  createWriteToFile,
  type WriteToFileArgs,
} from "@rectangular-labs/loro-file-system";
import { safeSync } from "@rectangular-labs/result";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { LoroDoc, VersionVector } from "loro-crdt";
import { getApiClient } from "../api";

function getWorkspaceSyncKey(workspaceBlobUri: string) {
  return `${workspaceBlobUri}::sync`;
}

const loroWriter = createWriteToFile<
  FsNodePayload,
  WriteToFilePublishingContext
>({
  middleware: [
    addCreatedAtOnCreateMiddleware(),
    addScheduledForWhenPlannedMiddleware(),
  ],
});

type WorkspaceSyncState = {
  /**
   * Encoded VersionVector bytes.
   */
  syncedOplogVersion: Uint8Array;
  /**
   * ISO date string
   */
  lastSyncedAt: string;
  /**
   * The snapshot of the document.
   */
  snapshot: Uint8Array;
};

function getPullDocumentQueryKey({
  organizationId,
  projectId,
  campaignId,
}: {
  organizationId: string;
  projectId: string;
  campaignId: string | null;
}) {
  return ["pullDocument", organizationId, projectId, campaignId] as const;
}

async function consolidateAndStoreServerUpdate({
  doc,
  serverUpdateBlob,
  idbKey,
}: {
  doc: LoroDoc<LoroDocMapping>;
  serverUpdateBlob: Blob;
  idbKey: string;
}) {
  const docUpdates = new Uint8Array(await serverUpdateBlob.arrayBuffer());
  if (docUpdates.byteLength > 0) {
    const importResult = safeSync(() => doc.import(docUpdates));
    if (!importResult.ok) {
      // error importing blob, delete it from idb and resync from server.
      // This would throw, and we would resync when the query is retried.
      await idbDel(idbKey);
      throw importResult.error;
    }
  }
  const syncState: WorkspaceSyncState = {
    syncedOplogVersion: doc.oplogVersion().encode(),
    lastSyncedAt: new Date().toISOString(),
    snapshot: doc.export({ mode: "snapshot" }),
  };
  await idbSet(idbKey, syncState);
}

export function createPullDocumentQueryOptions({
  organizationId,
  projectId,
  campaignId,
}: {
  organizationId: string;
  projectId: string;
  campaignId: string | null;
}) {
  const queryKey = getPullDocumentQueryKey({
    organizationId,
    projectId,
    campaignId,
  });
  return queryOptions({
    queryKey,
    queryFn: async ({ client }) => {
      const idbKey = getWorkspaceSyncKey(
        getWorkspaceBlobUri({
          orgId: organizationId,
          projectId,
          campaignId,
        }),
      );
      const syncState = await idbGet<WorkspaceSyncState>(idbKey);
      const doc = new LoroDoc<LoroDocMapping>();
      if (syncState) {
        const importResult = safeSync(() => doc.import(syncState.snapshot));
        if (!importResult.ok) {
          await idbDel(idbKey);
          throw importResult.error;
        }
      }

      const floatingSync = getApiClient()
        .project.pullDocument({
          projectId,
          campaignId,
          organizationIdentifier: organizationId,
          opLogVersion: new Blob([new Uint8Array(doc.oplogVersion().encode())]),
        })
        .then(async (pullResult) => {
          await consolidateAndStoreServerUpdate({
            doc,
            serverUpdateBlob: pullResult.blob,
            idbKey,
          });
          const updatedDoc = new LoroDoc<LoroDocMapping>();
          updatedDoc.import(doc.export({ mode: "snapshot" }));
          client.setQueryData(queryKey, updatedDoc);
          return doc;
        });

      // If we have cached data, return immediately and let the network run in the background.
      if (syncState) {
        void floatingSync;
        return doc;
      }
      // No cached data — block on the network for first load.
      return await floatingSync;
    },
    enabled: !!organizationId && !!projectId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}

export function createPushDocumentQueryOptions({
  organizationId,
  projectId,
  campaignId,
}: {
  organizationId: string;
  projectId: string;
  campaignId: string | null;
}) {
  const pullDocumentQueryKey = createPullDocumentQueryOptions({
    organizationId,
    projectId,
    campaignId,
  }).queryKey;
  return mutationOptions({
    mutationKey: ["pushDocument", organizationId, projectId, campaignId],
    mutationFn: async (
      {
        doc,
        context,
        operations,
      }: {
        doc: LoroDoc<LoroDocMapping>;
        context: WriteToFilePublishingContext;
        operations: Omit<WriteToFileArgs<FsNodePayload>, "tree">[];
      },
      { client },
    ) => {
      const idbKey = getWorkspaceSyncKey(
        getWorkspaceBlobUri({
          orgId: organizationId,
          projectId,
          campaignId,
        }),
      );
      let syncState = await idbGet<WorkspaceSyncState>(idbKey);
      if (!syncState) {
        // this should be super unlikely (i.e. user somehow manually cleared their cache). In case it happens, we just pull the document from the server.
        await client.fetchQuery(
          createPullDocumentQueryOptions({
            organizationId,
            projectId,
            campaignId,
          }),
        );
        syncState = await idbGet<WorkspaceSyncState>(idbKey);
      }
      if (!syncState) {
        throw new Error("Failed to find existing document");
      }

      await Promise.all(
        operations.map(async (operation) => {
          await loroWriter.writeToFile({
            ...operation,
            tree: doc.getTree("fs"),
            context,
          });
        }),
      );

      await idbSet(idbKey, {
        ...syncState,
        snapshot: doc.export({ mode: "snapshot" }),
      });
      const updatedDoc = new LoroDoc<LoroDocMapping>();
      updatedDoc.import(doc.export({ mode: "snapshot" }));
      client.setQueryData(pullDocumentQueryKey, updatedDoc);

      const base = new VersionVector(syncState.syncedOplogVersion);
      void getApiClient()
        .project.pushDocument({
          projectId,
          campaignId,
          organizationIdentifier: organizationId,
          opLogVersion: new Blob([new Uint8Array(doc.oplogVersion().encode())]),
          blobUpdate: new Blob([
            new Uint8Array(doc.export({ mode: "update", from: base })),
          ]),
        })
        .then(async (pushResult) => {
          await consolidateAndStoreServerUpdate({
            doc,
            serverUpdateBlob: pushResult.blob,
            idbKey,
          });
          const updatedDoc = new LoroDoc<LoroDocMapping>();
          updatedDoc.import(doc.export({ mode: "snapshot" }));
          client.setQueryData(pullDocumentQueryKey, updatedDoc);
          return pushResult;
        })
        .catch((error) => {
          console.log("error", error);
          const message =
            error instanceof Error ? error.message.toLowerCase() : "";
          const isNetworkError =
            error instanceof TypeError ||
            message.includes("network") ||
            message.includes("fetch");
          if (!isNetworkError) {
            throw error;
          }
        });

      return { success: true } as const;
    },
  });
}
