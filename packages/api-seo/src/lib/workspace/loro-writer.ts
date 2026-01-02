import {
  addCreatedAtOnCreateMiddleware,
  addScheduledForWhenQueuedMiddleware,
  type FsNodePayload,
  type WriteToFilePublishingContext,
} from "@rectangular-labs/core/loro-file-system";
import type { WriteToFileMiddleware } from "@rectangular-labs/loro-file-system";
import {
  createWriteToFile,
  getNodePath,
} from "@rectangular-labs/loro-file-system";
import { getWebsocketContext } from "../../context";
import { createTask } from "../task";

// TODO: remove reliance on context
function addStartResearchWorkflowOnSuggestedCreate(): WriteToFileMiddleware<
  FsNodePayload,
  WriteToFilePublishingContext
> {
  return async ({ ctx, next }) => {
    const status = ctx.getMetadata("status");
    if (status !== "suggested") return await next();

    const isNew = !ctx.getExistingNode();
    if (!isNew) return await next();

    const primaryKeyword = (ctx.getMetadata("primaryKeyword") ?? "").trim();
    if (!primaryKeyword) return await next();

    ctx.addOnCreateNode((node) => {
      if (node.data.get("type") !== "file") return node;
      void (async () => {
        const ws = getWebsocketContext();
        const path = getNodePath(node);
        const result = await createTask({
          db: ws.db,
          userId: ctx.context.userId,
          workflowInstanceId: `plan_${crypto.randomUUID()}`,
          input: {
            type: "seo-plan-keyword",
            userId: ctx.context.userId,
            projectId: ws.projectId,
            organizationId: ws.organizationId,
            campaignId: ws.campaignId,
            path,
          },
        });
        if (!result.ok) {
          console.error("Failed to start research workflow", result.error);
        }
      })();
      return node;
    });

    return await next();
  };
}

function addStartWritingWorkflowWhenQueued(): WriteToFileMiddleware<
  FsNodePayload,
  WriteToFilePublishingContext
> {
  return async ({ ctx, next }) => {
    const status = ctx.getMetadata("status");
    if (status !== "queued") return await next();

    const existingNode = ctx.getExistingNode();
    const existingWorkflowId = existingNode?.data.get("workflowId");
    if (existingWorkflowId?.trim()) {
      return await next();
    }

    // Set workflowId immediately so subsequent edits don't retrigger while the Workflow starts.
    const workflowId = `write_${crypto.randomUUID()}`;
    ctx.setMetadata("workflowId", workflowId);

    const start = async (path: string) => {
      const ws = getWebsocketContext();
      const result = await createTask({
        db: ws.db,
        userId: ctx.context.userId,
        workflowInstanceId: workflowId,
        input: {
          type: "seo-write-article",
          userId: ctx.context.userId,
          projectId: ws.projectId,
          organizationId: ws.organizationId,
          campaignId: ws.campaignId,
          path,
        },
      });
      if (!result.ok) {
        console.error("Failed to start writing workflow", result.error);
        ctx.setMetadata("workflowId", "");
        throw result.error;
      }
    };

    if (existingNode) {
      await start(getNodePath(existingNode));
      return await next();
    }

    ctx.addOnCreateNode((node) => {
      if (node.data.get("type") !== "file") return node;
      void start(getNodePath(node));
      return node;
    });

    return await next();
  };
}

export const loroWriter = createWriteToFile<
  FsNodePayload,
  WriteToFilePublishingContext
>({
  middleware: [
    addCreatedAtOnCreateMiddleware(),
    addScheduledForWhenQueuedMiddleware(),
    addStartResearchWorkflowOnSuggestedCreate(),
    addStartWritingWorkflowWhenQueued(),
  ],
});
