import {
  addCreatedAtOnCreateMiddleware,
  addScheduledForWhenPlannedMiddleware,
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
          userId: ws.userId,
          input: {
            type: "seo-plan-keyword",
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

function addStartWritingWorkflowWhenPlanned(): WriteToFileMiddleware<
  FsNodePayload,
  WriteToFilePublishingContext
> {
  return async ({ ctx, next }) => {
    const status = ctx.getMetadata("status");
    if (status !== "planned") return await next();

    const existingNode = ctx.getExistingNode();
    const existingWorkflowId = existingNode?.data.get("workflowId");
    if (typeof existingWorkflowId === "string" && existingWorkflowId.trim()) {
      return await next();
    }

    // Set workflowId immediately so subsequent edits don't retrigger while the Workflow starts.
    const workflowId = crypto.randomUUID();
    ctx.setMetadata("workflowId", workflowId);

    const start = async (path: string) => {
      const ws = getWebsocketContext();
      const result = await createTask({
        userId: ws.userId,
        workflowInstanceId: workflowId,
        input: {
          type: "seo-write-article",
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
    addScheduledForWhenPlannedMiddleware(),
    addStartResearchWorkflowOnSuggestedCreate(),
    addStartWritingWorkflowWhenPlanned(),
  ],
});
