import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { SeoFileStatus } from "@rectangular-labs/core/loro-file-system";
import type {
  seoWriteArticleTaskInputSchema,
  seoWriteArticleTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { writeToFile } from "@rectangular-labs/loro-file-system";
import { generateText, stepCountIs } from "ai";
import type { type } from "arktype";
import { createImageToolsWithMetadata } from "../lib/ai/tools/image-tools";
import { createInternalLinksToolWithMetadata } from "../lib/ai/tools/internal-links-tool";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { buildWriterSystemPrompt } from "../lib/ai/writer-agent";
import { createPublicImagesBucket } from "../lib/bucket";
import {
  loadWorkspaceForWorkflow,
  persistWorkspaceSnapshot,
} from "../lib/workspace/workflow";
import type { InitialContext } from "../types";

type WriterInput = type.infer<typeof seoWriteArticleTaskInputSchema>;
export class SeoWriterWorkflow extends WorkflowEntrypoint<
  {
    SEO_PLANNER_WORKFLOW: InitialContext["seoPlannerWorkflow"];
  },
  WriterInput
> {
  async run(event: WorkflowEvent<WriterInput>, step: WorkflowStep) {
    const input = event.payload;

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
        return workspaceResult.value.node.data.get("outline") !== null;
      },
    );
    if (!isOutlinePresent) {
      const plannerEvent = await step.waitForEvent<{ path: string }>(
        "wait for planner callback",
        {
          type: "planner.complete",
          timeout: "1 hour",
        },
      );
      if (plannerEvent.payload.path !== input.path) {
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

          const result = await generateText({
            model: openai("gpt-5.2"),
            providerOptions: {
              openai: {
                reasoningEffort: "medium",
              } satisfies OpenAIResponsesProviderOptions,
            },
            system: systemPrompt,
            messages: [
              {
                role: "user",
                content: "Write the full article now.",
              },
            ],
            tools: {
              ...webTools.tools,
              ...internalLinksTools.tools,
              ...imageTools.tools,
            },
            stopWhen: [stepCountIs(40)],
          });

          const text = result.text.trim();
          if (!text) throw new Error("Empty article returned by model");
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
        await writeToFile({
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

        const persistResult = await persistWorkspaceSnapshot({
          workspaceBlobUri,
          loroDoc,
        });
        if (!persistResult.ok) throw persistResult.error;
      });
      return {
        type: "seo-write-article",
        path: input.path,
        content: articleMarkdown,
      } satisfies typeof seoWriteArticleTaskOutputSchema.infer;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
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
