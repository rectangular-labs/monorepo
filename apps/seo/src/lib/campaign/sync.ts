import { getWorkspaceBlobUri } from "@rectangular-labs/api-seo/client";
import type { LoroDocMapping } from "@rectangular-labs/api-seo/types";
import { safe, safeSync } from "@rectangular-labs/result";
import type { QueryClient } from "@tanstack/react-query";
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
  serverOplogVersion: Uint8Array;
  /**
   * ISO date string
   */
  lastSyncedAt: string;
};

export function createPullDocumentQueryOptions({
  organizationId,
  projectId,
  campaignId,
  queryClient,
}: {
  organizationId: string;
  projectId: string;
  campaignId: string | null;
  queryClient?: QueryClient;
}) {
  return queryOptions({
    queryKey: ["pullDocument", organizationId, projectId, campaignId],
    queryFn: async () => {
      const idbKey = getWorkspaceBlobUri({
        orgId: organizationId,
        projectId,
        campaignId,
      });
      const campaignBlob = await idbGet<Uint8Array>(idbKey);
      const doc = new LoroDoc<LoroDocMapping>();
      if (campaignBlob) {
        const importResult = safeSync(() => doc.import(campaignBlob));
        if (!importResult.ok) {
          await idbDel(idbKey);
          throw importResult.error;
        }
      }

      const initialDoc = doc;

      const floatingSync = (async () => {
        const pullResult = await getApiClient().project.pullDocument({
          projectId,
          campaignId,
          organizationIdentifier: organizationId,
          opLogVersion: new Blob([
            new Uint8Array(initialDoc.oplogVersion().encode()),
          ]),
        });

        const docUpdates = new Uint8Array(await pullResult.blob.arrayBuffer());
        const updatedDoc = new LoroDoc<LoroDocMapping>();
        updatedDoc.import(initialDoc.export({ mode: "snapshot" }));

        if (docUpdates.byteLength > 0) {
          const importResult = await safe(async () =>
            updatedDoc.import(docUpdates),
          );
          if (!importResult.ok) {
            // error importing blob, delete it from idb and resync from server.
            await idbDel(idbKey);
            throw importResult.error;
          }
        }

        await idbSet(idbKey, updatedDoc.export({ mode: "snapshot" }));
        const syncState: WorkspaceSyncState = {
          serverOplogVersion: new Uint8Array(
            await pullResult.opLogVersion.arrayBuffer(),
          ),
          lastSyncedAt: new Date().toISOString(),
        };
        await idbSet(getWorkspaceSyncKey(idbKey), syncState);

        if (queryClient) {
          queryClient.setQueryData(
            ["pullDocument", organizationId, projectId, campaignId],
            updatedDoc,
          );
        }
      })();

      // If we have cached data, return immediately and let the network run in the background.
      if (campaignBlob) {
        void floatingSync;
        return initialDoc;
      }

      // No cached data — block on the network for first load.
      await floatingSync;
      const latest = queryClient?.getQueryData<LoroDoc<LoroDocMapping>>([
        "pullDocument",
        organizationId,
        projectId,
        campaignId,
      ]);
      return latest ?? initialDoc;
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
  return mutationOptions({
    mutationKey: ["pushDocument", organizationId, projectId, campaignId],
    mutationFn: async ({
      doc,
      workspaceFilePath,
      nextMarkdown,
    }: {
      doc: LoroDoc<LoroDocMapping>;
      /**
       * Absolute workspace path, e.g. `/seo-guides/how-to.md`
       */
      workspaceFilePath: string;
      nextMarkdown: string;
    }) => {
      const idbKey = getWorkspaceBlobUri({
        orgId: organizationId,
        projectId,
        campaignId,
      });
      const syncState =
        (await idbGet<WorkspaceSyncState>(getWorkspaceSyncKey(idbKey))) ??
        ({
          serverOplogVersion: new Uint8Array(doc.oplogVersion().encode()),
          lastSyncedAt: new Date(0).toISOString(),
        } satisfies WorkspaceSyncState);

      // Update local document & persist immediately for offline safety.
      const { writeToFile } = await import(
        "@rectangular-labs/loro-file-system"
      );
      writeToFile({
        tree: doc.getTree("fs"),
        path: workspaceFilePath,
        content: nextMarkdown,
      });
      await idbSet(idbKey, doc.export({ mode: "snapshot" }));

      const base = new VersionVector(syncState.serverOplogVersion);
      const blobUpdate = doc.export({ mode: "update", from: base });

      const pushResult = await getApiClient().project.pushDocument({
        projectId,
        campaignId,
        organizationIdentifier: organizationId,
        opLogVersion: new Blob([new Uint8Array(syncState.serverOplogVersion)]),
        blobUpdate: new Blob([new Uint8Array(blobUpdate)]),
      });

      const serverUpdates = new Uint8Array(await pushResult.blob.arrayBuffer());
      if (serverUpdates.byteLength > 0) {
        const importResult = await safe(async () => doc.import(serverUpdates));
        if (!importResult.ok) {
          await idbDel(idbKey);
          throw importResult.error;
        }
        await idbSet(idbKey, doc.export({ mode: "snapshot" }));
      }

      const nextSyncState: WorkspaceSyncState = {
        serverOplogVersion: new Uint8Array(
          await pushResult.opLogVersion.arrayBuffer(),
        ),
        lastSyncedAt: new Date().toISOString(),
      };
      await idbSet(getWorkspaceSyncKey(idbKey), nextSyncState);

      return { lastSyncedAt: nextSyncState.lastSyncedAt } as const;
    },
  });
}
