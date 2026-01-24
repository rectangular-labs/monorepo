import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { google } from "@ai-sdk/google";
import { toSlug } from "@rectangular-labs/core/format/to-slug";
import type { seoUnderstandSiteTaskInputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { seoUnderstandSiteTaskOutputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import type { type } from "arktype";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { DEFAULT_BRAND_VOICE } from "../lib/workspace/workflow.constant";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoOnboardingWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoOnboardingWorkflow] ${message}`, data ?? {});
}

type OnboardingInput = typeof seoUnderstandSiteTaskInputSchema.infer;
export type SeoOnboardingWorkflowBinding = Workflow<OnboardingInput>;
export class SeoOnboardingWorkflow extends WorkflowEntrypoint<
  {
    CACHE: InitialContext["cacheKV"];
  },
  OnboardingInput
> {
  async run(event: WorkflowEvent<OnboardingInput>, step: WorkflowStep) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      projectId: input.projectId,
    });

    const project = await step.do("load project", async () => {
      const db = createDb();
      const projectResult = await db.query.seoProject.findFirst({
        where: (table, { eq }) => eq(table.id, input.projectId),
      });
      if (!projectResult) {
        throw new NonRetryableError(`Project (${input.projectId}) not found`);
      }
      return projectResult;
    });

    const researchResult = await step.do(
      "research business background",
      {
        timeout: "30 minutes",
      },
      async () => {
        const { tools } = createWebToolsWithMetadata(project, this.env.CACHE);
        const system = `You are an SEO research expert extracting concise, high-signal business context.

## Task
- Research the provided website to extract business context, target audience, competitors and content strategy insights.
- Find 3-5 blog/article URLs from the SAME DOMAIN as the website to analyze writing tone.

## Guidelines
- Use ONLY the web_search and web_fetch tools to gather information. We want to make sure that the date is accurate and up to date at all times.
- Prioritize the site's own pages over external sources.
- Be conservative and never guess. Only report verified information that is publicly stated
- If uncertain about location or language, use schema defaults (US, San Francisco, en).
- For blog tone research, look for blogs and articles that are published on the same domain (can be a sub-domain) as the website. If none exist, simply return an empty string for the brand voice.

## Expectations
- All information must be current and up to date.
- Provide clear and concise, high-signal insights rather than verbose descriptions.
- Summarize the writing tone based on actual blog samples found.`;

        const { experimental_output } = await generateText({
          model: google("gemini-3-flash-preview"),
          system,
          tools,
          prompt: `Extract business background and blog tone from: ${project.websiteUrl}`,
          stopWhen: [stepCountIs(35)],
          experimental_output: Output.object({
            schema: jsonSchema<
              type.infer<typeof seoUnderstandSiteTaskOutputSchema>
            >(seoUnderstandSiteTaskOutputSchema.toJsonSchema() as JSONSchema7),
          }),
        });

        return experimental_output;
      },
    );

    await step.do("update project with research results", async () => {
      const brandVoiceFromSamples = researchResult.brandVoice.trim() || "";

      const nextBrandVoice = `## Writing Tone
${brandVoiceFromSamples}

## Writing Guidelines
${DEFAULT_BRAND_VOICE}`;

      const nextName = researchResult.name.trim();
      const nextSlug = nextName ? toSlug(nextName) : undefined;

      const db = createDb();
      const updateResult = await updateSeoProject(db, {
        id: project.id,
        organizationId: project.organizationId,
        name: nextName || project.name,
        slug: nextSlug ?? project.slug,
        businessBackground: {
          ...researchResult.businessBackground,
          version: "v1",
        },
        writingSettings: {
          ...project.writingSettings,
          brandVoice: nextBrandVoice,
        },
      });

      if (!updateResult.ok) {
        logError("failed to update project", {
          projectId: project.id,
          error: updateResult.error,
        });
        throw updateResult.error;
      }

      return { nextName };
    });

    return researchResult satisfies typeof seoUnderstandSiteTaskOutputSchema.infer;
  }
}
