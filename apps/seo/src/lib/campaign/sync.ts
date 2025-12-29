import { getWorkspaceBlobUri } from "@rectangular-labs/api-seo/client";
import type { LoroDocMapping } from "@rectangular-labs/api-seo/types";
import { safeSync } from "@rectangular-labs/result";
import { mutationOptions, queryOptions } from "@tanstack/react-query";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { LoroDoc, VersionVector } from "loro-crdt";
import { getApiClient } from "../api";

function getWorkspaceSyncKey(workspaceBlobUri: string) {
  return `${workspaceBlobUri}::sync`;
}

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
  const queryKey = ["pullDocument", organizationId, projectId, campaignId];
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
          client.setQueryData(queryKey, doc);
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
  type PushOperation =
    | {
        type: "writeToFile";
        /**
         * Absolute workspace path, e.g. `/seo-guides/how-to.md`
         */
        path: string;
        content?: string;
        createIfMissing?: boolean;
        metadata?: { key: string; value: string }[] | undefined;
      }
    | {
        type: "setMetadata";
        /**
         * Absolute workspace path, e.g. `/seo-guides/how-to.md`
         */
        path: string;
        metadata: { key: string; value: string }[];
      };
  return mutationOptions({
    mutationKey: ["pushDocument", organizationId, projectId, campaignId],
    mutationFn: async (
      {
        doc,
        operations,
      }: {
        doc: LoroDoc<LoroDocMapping>;
        operations: PushOperation[];
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
        syncState = await idbGet<WorkspaceSyncState>(
          getWorkspaceSyncKey(idbKey),
        );
      }
      if (!syncState) {
        throw new Error("Failed to find existing document");
      }

      // Update local document & persist immediately for offline safety.
      const { resolvePath, writeToFile } = await import(
        "@rectangular-labs/loro-file-system"
      );
      const tree = doc.getTree("fs");
      for (const operation of operations) {
        switch (operation.type) {
          case "writeToFile": {
            const result = writeToFile({
              tree,
              path: operation.path,
              content: operation.content,
              createIfMissing: operation.createIfMissing ?? false,
              metadata: operation.metadata,
            });
            if (!result.success) {
              throw new Error(result.message);
            }
            break;
          }
          case "setMetadata": {
            const node = resolvePath({ tree, path: operation.path });
            if (!node) {
              throw new Error(`Path ${operation.path} not found`);
            }
            if (node.data.get("type") !== "file") {
              throw new Error(
                `Cannot set metadata on ${operation.path} because it is not a file`,
              );
            }
            const result = writeToFile({
              tree,
              path: operation.path,
              // no-op content write; just apply metadata
              content: undefined,
              createIfMissing: false,
              metadata: operation.metadata,
            });
            if (!result.success) {
              throw new Error(result.message);
            }
            break;
          }
          default: {
            const _never: never = operation;
            throw new Error(`Unsupported operation`);
          }
        }
      }
      await idbSet(idbKey, {
        ...syncState,
        snapshot: doc.export({ mode: "snapshot" }),
      });

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

      return { success: true, lastSyncedAt: new Date().toISOString() } as const;
    },
  });
}
