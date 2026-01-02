import type {
  FsNodePayload,
  LoroDocMapping,
} from "@rectangular-labs/core/loro-file-system";
import { getWorkspaceBlobUri } from "@rectangular-labs/core/workspace/get-workspace-blob-uri";
import { createDb, type schema } from "@rectangular-labs/db";
import { getSeoProjectByIdentifierAndOrgId } from "@rectangular-labs/db/operations";
import { resolvePath } from "@rectangular-labs/loro-file-system";
import { err, ok, type Result, safe } from "@rectangular-labs/result";
import { LoroDoc, type LoroTreeNode } from "loro-crdt";
import { createWorkspaceBucket } from "../bucket";

type LoadedWorkspace = {
  workspaceBlobUri: string;
  loroDoc: LoroDoc<LoroDocMapping>;
  node: LoroTreeNode<FsNodePayload>;
  project: Omit<typeof schema.seoProject.$inferSelect, "serpSnapshot">;
};

export async function loadWorkspaceForWorkflow(args: {
  organizationId: string;
  projectId: string;
  campaignId?: string | null;
  path: string;
}): Promise<Result<LoadedWorkspace, Error>> {
  const db = createDb();
  const workspaceBucket = createWorkspaceBucket();

  const projectResult = await getSeoProjectByIdentifierAndOrgId(
    db,
    args.projectId,
    args.organizationId,
    {
      businessBackground: true,
      imageSettings: true,
      writingSettings: true,
      publishingSettings: true,
    },
  );
  if (!projectResult.ok) return projectResult;
  if (!projectResult.value) {
    return err(new Error(`Project (${args.projectId}) not found`));
  }
  const project = projectResult.value;

  const desiredWorkspaceBlobUri = getWorkspaceBlobUri({
    orgId: args.organizationId,
    projectId: args.projectId,
    campaignId: args.campaignId,
  });

  const blobResult = await safe(() =>
    workspaceBucket.getSnapshot(desiredWorkspaceBlobUri),
  );
  if (!blobResult.ok) return blobResult;
  if (!blobResult.value) {
    return err(
      new Error(`Workspace blob (${desiredWorkspaceBlobUri}) not found`),
    );
  }

  const blob = blobResult.value;
  const loroDoc = new LoroDoc<LoroDocMapping>();
  if (blob.buffer.byteLength) {
    loroDoc.import(new Uint8Array(blob.buffer));
  }

  const node = resolvePath({ tree: loroDoc.getTree("fs"), path: args.path });
  if (!node) return err(new Error(`Path (${args.path}) not found`));

  return ok({
    workspaceBlobUri: desiredWorkspaceBlobUri,
    loroDoc,
    node,
    project,
  });
}

export async function persistWorkspaceSnapshot(args: {
  workspaceBlobUri: string;
  loroDoc: LoroDoc<LoroDocMapping>;
}): Promise<Result<true, Error>> {
  const workspaceBucket = createWorkspaceBucket();
  const snapshot = args.loroDoc.export({ mode: "snapshot" });
  const result = await safe(() =>
    workspaceBucket.setSnapshot(args.workspaceBlobUri, snapshot),
  );
  if (!result.ok) return result;
  return ok(true);
}
