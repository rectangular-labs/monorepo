import { ORPCError } from "@orpc/server";
import { and, desc, eq, lt, schema } from "@rectangular-labs/db";
import {
  deleteSeoProject,
  getSeoProjectByIdentifierAndOrgId,
  updateSeoProject,
} from "@rectangular-labs/db/operations";
import { type } from "arktype";
import { LoroDoc, VersionVector } from "loro-crdt";
import { withOrganizationIdBase } from "../context";
import { upsertProject } from "../lib/database/project";
import { createTask } from "../lib/task";
import { validateOrganizationMiddleware } from "../lib/validate-organization";
import {
  forkAndUpdateWorkspaceBlob,
  getWorkspaceBlobUri,
} from "../lib/workspace";
import { metrics } from "./project.metrics";
import {
  getArticleSettings,
  getBusinessBackground,
  getImageSettings,
  uploadProjectImage,
  upsertAuthors,
} from "./project.settings";

const list = withOrganizationIdBase
  .route({ method: "GET", path: "/" })
  .input(
    type({
      organizationIdentifier: "string",
      limit: "1<=number<=100 = 20",
      "cursor?": "string.uuid|undefined",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    type({
      data: schema.seoProjectSelectSchema.array(),
      nextPageCursor: "string.uuid|undefined",
    }),
  )
  .handler(async ({ context, input }) => {
    const rows = await context.db.query.seoProject.findMany({
      where: and(
        eq(schema.seoProject.organizationId, context.organization.id),
        input.cursor ? lt(schema.seoProject.id, input.cursor) : undefined,
      ),
      orderBy: desc(schema.seoProject.id),
      limit: input.limit + 1,
    });
    const data = rows.slice(0, input.limit);
    const nextPageCursor =
      rows.length > input.limit ? data.at(-1)?.id : undefined;
    return { data, nextPageCursor };
  });

const checkName = withOrganizationIdBase
  .route({ method: "GET", path: "/check-name/{name}" })
  .input(type({ name: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ exists: "boolean" }))
  .handler(async ({ context, input }) => {
    const row = await context.db.query.seoProject.findFirst({
      where: and(
        eq(schema.seoProject.organizationId, context.organization.id),
        eq(schema.seoProject.name, input.name),
      ),
    });
    // we want name to be unique within an organization
    return { exists: !!row };
  });

const get = withOrganizationIdBase
  .route({ method: "GET", path: "/{identifier}" })
  .input(
    type({
      identifier: "string",
      organizationIdentifier: "string",
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(
    schema.seoProjectSelectSchema.omit(
      "businessBackground",
      "imageSettings",
      "writingSettings",
      "serpSnapshot",
    ),
  )
  .handler(async ({ context, input }) => {
    const projectResult = await getSeoProjectByIdentifierAndOrgId(
      context.db,
      input.identifier,
      context.organization.id,
    );
    if (!projectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: projectResult.error.message,
        cause: projectResult.error,
      });
    }
    if (!projectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found with identifier.",
      });
    }
    return projectResult.value;
  });

const setUpWorkspace = withOrganizationIdBase
  .route({ method: "POST", path: "/{projectId}/setup-workspace" })
  .input(type({ projectId: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ workspaceBlobUri: "string" }))
  .handler(async ({ context, input }) => {
    const workspaceDoc = new LoroDoc();
    const workspaceBlobUri = getWorkspaceBlobUri({
      orgId: context.organization.id,
      projectId: input.projectId,
      campaignId: undefined,
    });
    const [_, updatedProject] = await Promise.all([
      context.workspaceBucket.setSnapshot(
        workspaceBlobUri,
        workspaceDoc.export({ mode: "snapshot" }),
      ),
      updateSeoProject(context.db, {
        id: input.projectId,
        organizationId: context.organization.id,
        workspaceBlobUri,
      }),
    ]);
    if (!updatedProject.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: updatedProject.error.message,
      });
    }
    if (!updatedProject.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to update.",
      });
    }

    return { workspaceBlobUri } as const;
  });

const create = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(
    schema.seoProjectInsertSchema.pick("websiteUrl").merge(
      type({
        organizationIdentifier: "string",
      }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoProjectSelectSchema.merge(type({ taskId: "string" })))
  .handler(async ({ context, input }) => {
    // TODO(txn): revisit when we can support transactions
    const upsertProjectResult = await upsertProject({
      organizationId: context.organization.id,
      websiteUrl: input.websiteUrl,
    });
    if (!upsertProjectResult.ok) {
      throw upsertProjectResult.error;
    }
    const createTaskResult = await createTask({
      projectId: upsertProjectResult.value.id,
      userId: context.user.id,
      input: {
        type: "understand-site",
        websiteUrl: input.websiteUrl,
      },
    });
    if (!createTaskResult.ok) {
      throw createTaskResult.error;
    }
    return { ...upsertProjectResult.value, taskId: createTaskResult.value.id };
  });

const update = withOrganizationIdBase
  .route({ method: "PATCH", path: "/{id}" })
  .input(
    schema.seoProjectUpdateSchema.merge(
      type({ organizationIdentifier: "string" }),
    ),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(schema.seoProjectSelectSchema)
  .handler(async ({ context, input }) => {
    const updateProjectResult = await updateSeoProject(context.db, input);
    if (!updateProjectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: updateProjectResult.error.message,
      });
    }
    if (!updateProjectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to update.",
      });
    }
    return updateProjectResult.value;
  });

const remove = withOrganizationIdBase
  .route({ method: "DELETE", path: "/{id}" })
  .input(type({ id: "string", organizationIdentifier: "string" }))
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ success: "true" }))
  .handler(async ({ context, input }) => {
    const deleteProjectResult = await deleteSeoProject(
      context.db,
      input.id,
      context.organization.id,
    );
    if (!deleteProjectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: deleteProjectResult.error.message,
      });
    }
    if (!deleteProjectResult.value) {
      throw new ORPCError("NOT_FOUND", {
        message: "No project found to delete.",
      });
    }
    return { success: true } as const;
  });

const syncDocument = withOrganizationIdBase
  .route({ method: "GET", path: "/{projectId}/sync-document" })
  .input(
    type({
      projectId: "string",
      campaignId: "string|null",
      organizationIdentifier: "string",
      opLogVersion: type.instanceOf(Blob),
    }),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationIdentifier)
  .output(type({ blob: type.instanceOf(Blob) }))
  .handler(async ({ context, input }) => {
    const workspaceBlobUri = getWorkspaceBlobUri({
      orgId: context.organization.id,
      projectId: input.projectId,
      campaignId: input.campaignId,
    });
    const mainBlobUri = getWorkspaceBlobUri({
      orgId: context.organization.id,
      projectId: input.projectId,
      campaignId: undefined,
    });
    const requestedBlob = await (async () => {
      const workspaceBlob =
        await context.workspaceBucket.getSnapshot(workspaceBlobUri);
      if (workspaceBlob) {
        return workspaceBlob;
      }
      // no blob found for workspaceBlobUri, we try falling back to main blob if it exists.
      // Note that campaignId has to exists in order for the workspaceBlobUri to be different
      if (workspaceBlobUri !== mainBlobUri && input.campaignId) {
        const mainBlob = await context.workspaceBucket.getSnapshot(mainBlobUri);
        if (!mainBlob) {
          throw new ORPCError("INTERNAL_SERVER_ERROR", {
            message: `Main workspace blob not found for ${input.projectId}`,
          });
        }
        // fork and update the workspace blob uri
        const forkedBuffer = await forkAndUpdateWorkspaceBlob({
          blob: mainBlob,
          newWorkspaceBlobUri: workspaceBlobUri,
          projectId: input.projectId,
          campaignId: input.campaignId,
          organizationId: context.organization.id,
          db: context.db,
          workspaceBucket: context.workspaceBucket,
        });
        return forkedBuffer;
      }
      return null;
    })();

    if (!requestedBlob) {
      throw new ORPCError("NOT_FOUND", {
        message: `Workspace blob not found.`,
        cause: new Error(
          `Workspace blob not found for ${input.campaignId ? `campaign ${input.campaignId}` : `project ${input.projectId}`}`,
        ),
      });
    }
    const doc = new LoroDoc();
    doc.import(requestedBlob);
    const updates = doc.export({
      mode: "update",
      from: new VersionVector(
        new Uint8Array(await input.opLogVersion.arrayBuffer()),
      ),
    });
    return { blob: new Blob([new Uint8Array(updates)]) };
  });

export default withOrganizationIdBase
  .prefix("/organization/{organizationIdentifier}/project")
  .router({
    list,
    create,
    update,
    upsertAuthors,
    remove,
    checkName,
    get,
    getBusinessBackground,
    getImageSettings,
    getArticleSettings,
    setUpWorkspace,
    metrics,
    syncDocument,
    uploadProjectImage,
  });
