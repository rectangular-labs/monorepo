"use server";
import { ORPCError } from "@orpc/client";
import { schema } from "@rectangular-labs/db";
import { seoWebsiteInfoSchema } from "@rectangular-labs/db/parsers";
import {
  getUnderstandSiteTask,
  triggerUnderstandSiteTask,
} from "@rectangular-labs/task/client";
import { type } from "arktype";
import { protectedBase, withOrganizationIdBase } from "../context";
import { upsertProject } from "../lib/database/project";

const understandSite = withOrganizationIdBase
  .route({ method: "POST", path: "/" })
  .input(schema.seoProjectInsertSchema.pick("websiteUrl"))
  .output(
    type({
      projectId: "string",
      organizationId: "string",
      taskId: "string",
    }),
  )
  .handler(async ({ context, input }) => {
    const { id: taskId } = await triggerUnderstandSiteTask(input.websiteUrl);

    // TODO(txn): revisit when we can support transactions
    const upsertProjectResult = await upsertProject({
      organizationId: context.session.activeOrganizationId,
      websiteUrl: input.websiteUrl,
    });
    if (!upsertProjectResult.ok) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating project",
      });
    }
    const [taskRun] = await context.db
      .insert(schema.seoTaskRun)
      .values({
        projectId: upsertProjectResult.value.id,
        requestedBy: context.user.id,
        taskId,
        provider: "trigger.dev",
        inputData: {
          type: "site-understanding",
          siteUrl: input.websiteUrl,
        },
      })
      .returning();
    if (!taskRun) {
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: "Error creating task run",
      });
    }
    return {
      projectId: upsertProjectResult.value.id,
      organizationId: context.session.activeOrganizationId,
      taskId: taskRun.id,
    };
  });

const outputSchema = type({
  progress: "0 <= number <= 100",
  status:
    "'pending' | 'queued' | 'running' | 'completed' | 'cancelled' | 'failed'",
  statusMessage: "string",
  "websiteInfo?": seoWebsiteInfoSchema
    .merge(type({ name: "string" }))
    .or(type.undefined),
});

const getUnderstandSiteStatus = protectedBase
  .route({
    method: "GET",
    path: "/{id}",
  })
  .input(type({ id: "string" }))
  .output(outputSchema)
  .handler(async ({ context, input }) => {
    const taskRun = await context.db.query.seoTaskRun.findFirst({
      where: (table, { eq }) => eq(table.id, input.id),
    });
    if (!taskRun || taskRun.inputData.type !== "site-understanding") {
      throw new ORPCError("NOT_FOUND", {
        message: "Task run not found",
      });
    }
    const task = await getUnderstandSiteTask(taskRun.taskId);
    if (!task) {
      throw new ORPCError("NOT_FOUND", {
        message: "Task not found",
      });
    }

    console.log("task", task);
    let status: (typeof outputSchema.infer)["status"] = "pending";
    if (task.isQueued) {
      status = "queued";
    }
    if (task.isExecuting) {
      status = "running";
    }
    if (task.isSuccess) {
      status = "completed";
    }
    if (task.isCancelled) {
      status = "cancelled";
    }
    if (task.isFailed) {
      status = "failed";
    }
    let progress = 0;
    if (task.metadata?.progress) {
      progress = task.metadata.progress;
    }
    let statusMessage = "We are setting things up...";
    if (task.metadata?.statusMessage) {
      statusMessage = task.metadata.statusMessage;
    }
    console.log("task.output", task.output);
    return {
      progress,
      status,
      statusMessage,
      websiteInfo: task.output?.websiteInfo,
    };
  });

export default protectedBase
  .prefix("/site-understanding")
  .router({ understandSite, getUnderstandSiteStatus });
