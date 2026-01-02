import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import type { GoogleGenerativeAIProviderOptions } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import type {
  seoWriteArticleTaskInputSchema,
  seoWriteArticleTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import { writeToFile } from "@rectangular-labs/loro-file-system";
import { generateText, stepCountIs } from "ai";
import type { type } from "arktype";
import { createImageToolsWithMetadata } from "../lib/ai/tools/image-tools";
import { createInternalLinksToolWithMetadata } from "../lib/ai/tools/internal-links-tool";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "../lib/ai/tools/todo-tool";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { buildWriterSystemPrompt } from "../lib/ai/writer-agent";
import { createPublicImagesBucket } from "../lib/bucket";
import { configureDataForSeoClient } from "../lib/dataforseo/utils";
import { createTask } from "../lib/task";
import {
  loadWorkspaceForWorkflow,
  persistWorkspaceSnapshot,
} from "../lib/workspace/workflow";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoWriterWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoWriterWorkflow] ${message}`, data ?? {});
}

type WriterInput = type.infer<typeof seoWriteArticleTaskInputSchema>;
export class SeoWriterWorkflow extends WorkflowEntrypoint<
  {
    SEO_PLANNER_WORKFLOW: InitialContext["seoPlannerWorkflow"];
  },
  WriterInput
> {
  async run(event: WorkflowEvent<WriterInput>, step: WorkflowStep) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      path: input.path,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      userId: input.userId,
    });
    configureDataForSeoClient();

    const isOutlinePresent = await step.do(
      "Ensure outline is present",
      async () => {
        const workspaceResult = await loadWorkspaceForWorkflow({
          organizationId: input.organizationId,
          projectId: input.projectId,
          campaignId: input.campaignId,
          path: input.path,
        });
        if (!workspaceResult.ok) throw workspaceResult.error;
        const outline = workspaceResult.value.node.data.get("outline");
        if (outline) {
          return true;
        }
        const result = await createTask({
          db: createDb(),
          input: {
            type: "seo-plan-keyword",
            projectId: input.projectId,
            organizationId: input.organizationId,
            campaignId: input.campaignId,
            path: input.path,
            callbackInstanceId: event.instanceId,
            userId: input.userId,
          },
          workflowInstanceId: `child-${event.instanceId}`,
          userId: input.userId,
        });
        if (!result.ok) {
          logError("failed to create planner task", {
            instanceId: event.instanceId,
            path: input.path,
            error: result.error,
          });
          throw result.error;
        }
        return false;
      },
    );
    logInfo("outline check", {
      instanceId: event.instanceId,
      path: input.path,
      isOutlinePresent,
    });
    if (!isOutlinePresent) {
      logInfo("waiting for planner callback", {
        instanceId: event.instanceId,
        path: input.path,
      });
      const plannerEvent = await step.waitForEvent<{ path: string }>(
        "wait for planner callback",
        {
          type: "planner_complete",
          timeout: "1 hour",
        },
      );
      logInfo("received planner callback", {
        instanceId: event.instanceId,
        expectedPath: input.path,
        receivedPath: plannerEvent.payload.path,
      });
      if (plannerEvent.payload.path !== input.path) {
        logError("planner callback path mismatch", {
          instanceId: event.instanceId,
          expectedPath: input.path,
          receivedPath: plannerEvent.payload.path,
        });
        throw new Error(
          `Planner callback path mismatch: expected ${input.path}, got ${plannerEvent.payload.path}`,
        );
      }
    }

    await step.do("mark generating", async () => {
      const workspaceResult = await loadWorkspaceForWorkflow({
        organizationId: input.organizationId,
        projectId: input.projectId,
        campaignId: input.campaignId,
        path: input.path,
      });
      if (!workspaceResult.ok) throw workspaceResult.error;
      const { loroDoc, workspaceBlobUri } = workspaceResult.value;
      const writeResult = await writeToFile({
        tree: loroDoc.getTree("fs"),
        path: input.path,
        metadata: [
          { key: "status", value: "generating" satisfies SeoFileStatus },
        ],
      });
      if (!writeResult.success) throw new Error(writeResult.message);
      const persistResult = await persistWorkspaceSnapshot({
        workspaceBlobUri,
        loroDoc,
      });
      if (!persistResult.ok) throw persistResult.error;
    });
    logInfo("status set to generating", {
      instanceId: event.instanceId,
      path: input.path,
    });
    try {
      const articleMarkdown = await step.do(
        "generate article markdown",
        {
          timeout: "30 minutes",
        },
        async () => {
          const workspaceResult = await loadWorkspaceForWorkflow({
            organizationId: input.organizationId,
            projectId: input.projectId,
            campaignId: input.campaignId,
            path: input.path,
          });
          if (!workspaceResult.ok) throw workspaceResult.error;
          const { project, node } = workspaceResult.value;

          const webTools = createWebToolsWithMetadata();
          const internalLinksTools = createInternalLinksToolWithMetadata(
            project.websiteUrl,
          );
          const imageTools = createImageToolsWithMetadata({
            organizationId: input.organizationId,
            projectId: input.projectId,
            imageSettings: project.imageSettings ?? null,
            publicImagesBucket: createPublicImagesBucket(),
          });
          const todoTool = createTodoToolWithMetadata({ messages: [] });

          logInfo("writer tools ready", {
            instanceId: event.instanceId,
            path: input.path,
            webToolCount: Object.keys(webTools.tools).length,
            internalLinksToolCount: Object.keys(internalLinksTools.tools)
              .length,
            imageToolCount: Object.keys(imageTools.tools).length,
          });

          const utcDate = new Intl.DateTimeFormat("en-US", {
            timeZone: "UTC",
            year: "numeric",
            month: "long",
            day: "numeric",
          }).format(new Date());

          const systemPrompt = buildWriterSystemPrompt({
            project,
            utcDate,
            skillsSection: "",
            mode: "workflow",
            primaryKeyword: node.data.get("primaryKeyword"),
            outline: node.data.get("outline"),
          });

          logInfo("starting article generation", {
            instanceId: event.instanceId,
            path: input.path,
          });

          const result = await generateText({
            model: openai("gpt-5.2"),
            providerOptions: {
              openai: {
                reasoningEffort: "medium",
              } satisfies OpenAIResponsesProviderOptions,
              google: {
                thinkingConfig: {
                  includeThoughts: true,
                  thinkingLevel: "medium",
                },
              } satisfies GoogleGenerativeAIProviderOptions,
            },
            tools: {
              ...webTools.tools,
              ...internalLinksTools.tools,
              ...imageTools.tools,
              ...todoTool.tools,
            },
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: "Write the full article now.",
              },
            ],
            onStepFinish: (step) => {
              logInfo(`[generateArticle] Step completed:`, {
                text: step.text,
                toolResults: JSON.stringify(step.toolResults, null, 2),
                usage: step.usage,
              });
            },
            prepareStep: ({ messages }) => {
              return {
                messages: [
                  ...messages,
                  {
                    role: "assistant",
                    content: formatTodoFocusReminder({
                      todos: todoTool.getSnapshot(),
                      maxOpen: 5,
                    }),
                  },
                ],
              };
            },
            stopWhen: [stepCountIs(40)],
          });

          const text = result.text.trim();
          if (!text) throw new Error("Empty article returned by model");
          logInfo("article generated", {
            instanceId: event.instanceId,
            path: input.path,
            articleChars: text.length,
            usage: result.usage ?? null,
          });
          return text;
        },
      );

      await step.do("Save article to file and update status", async () => {
        const workspaceResult = await loadWorkspaceForWorkflow({
          organizationId: input.organizationId,
          projectId: input.projectId,
          campaignId: input.campaignId,
          path: input.path,
        });
        if (!workspaceResult.ok) throw workspaceResult.error;
        const { loroDoc, workspaceBlobUri, project } = workspaceResult.value;
        const writeResult = await writeToFile({
          tree: loroDoc.getTree("fs"),
          path: input.path,
          content: articleMarkdown,
          metadata: [
            {
              key: "status",
              value: project.publishingSettings?.requireContentReview
                ? ("pending-review" satisfies SeoFileStatus)
                : ("scheduled" satisfies SeoFileStatus),
            },
          ],
        });
        if (!writeResult.success) throw new Error(writeResult.message);
        const persistResult = await persistWorkspaceSnapshot({
          workspaceBlobUri,
          loroDoc,
        });
        if (!persistResult.ok) throw persistResult.error;
      });
      logInfo("article saved", {
        instanceId: event.instanceId,
        path: input.path,
      });
      return {
        type: "seo-write-article",
        path: input.path,
        content: articleMarkdown,
      } satisfies typeof seoWriteArticleTaskOutputSchema.infer;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      logError("generation failed", {
        instanceId: event.instanceId,
        path: input.path,
        message,
      });
      await step.do("mark generation failed", async () => {
        const workspaceResult = await loadWorkspaceForWorkflow({
          organizationId: input.organizationId,
          projectId: input.projectId,
          campaignId: input.campaignId,
          path: input.path,
        });
        if (!workspaceResult.ok) throw workspaceResult.error;
        const { loroDoc, workspaceBlobUri } = workspaceResult.value;
        await writeToFile({
          tree: loroDoc.getTree("fs"),
          path: input.path,
          metadata: [
            {
              key: "status",
              value: "generation-failed" satisfies SeoFileStatus,
            },
            { key: "error", value: `Generation failed: ${message}` },
            { key: "workflowId", value: event.instanceId },
          ],
        });
        const persistResult = await persistWorkspaceSnapshot({
          workspaceBlobUri,
          loroDoc,
        });
        if (!persistResult.ok) throw persistResult.error;
      });
      throw e;
    }
  }
}
