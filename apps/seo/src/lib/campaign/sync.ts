import { getWorkspaceBlobUri } from "@rectangular-labs/api-seo/client";
import type { LoroDocMapping } from "@rectangular-labs/api-seo/types";
import { safe, safeSync } from "@rectangular-labs/result";
import { queryOptions } from "@tanstack/react-query";
import { del as idbDel, get as idbGet, set as idbSet } from "idb-keyval";
import { LoroDoc } from "loro-crdt";
import { getApiClient } from "../api";

export function createSyncDocumentQueryOptions({
  organizationId,
  projectId,
  campaignId,
}: {
  organizationId: string;
  projectId: string;
  campaignId: string | null;
}) {
  return queryOptions({
    queryKey: ["syncDocument", organizationId, projectId, campaignId],
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

      const syncResult = await getApiClient().project.syncDocument({
        projectId,
        campaignId,
        organizationIdentifier: organizationId,
        opLogVersion: new Blob([new Uint8Array(doc.oplogVersion().encode())]),
      });
      if (syncResult.blob) {
        const docUpdates = new Uint8Array(await syncResult.blob.arrayBuffer());
        const importResult = await safe(async () => doc.import(docUpdates));
        if (!importResult.ok) {
          // error importing blob, delete it from idb and resync from server.
          // This would throw, and we would retry the query.
          await idbDel(idbKey);
          throw importResult.error;
        }
        await idbSet(idbKey, doc.export({ mode: "snapshot" }));
      }

      return doc;
    },
    enabled: !!organizationId && !!projectId,
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 60, // 1 hour
  });
}
