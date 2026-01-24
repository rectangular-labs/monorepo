import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { toSlug } from "@rectangular-labs/core/format/to-slug";
import type { seoUnderstandSiteTaskInputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { seoUnderstandSiteTaskOutputSchema } from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import { safe } from "@rectangular-labs/result";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
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

    const { name } = await step.do(
      "extract project name from homepage title",
      {
        timeout: "10 minutes",
      },
      async () => {
        let homepageTitle = "";
        try {
          const response = await fetch(project.websiteUrl, {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            },
          });
          if (response.ok) {
            const html = await response.text();
            const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
            homepageTitle = match?.[1]?.trim() ?? "";
          }
        } catch (error) {
          logError("failed to fetch homepage", {
            url: project.websiteUrl,
            error: error instanceof Error ? error.message : String(error),
          });
        }

        logInfo("homepage title", { homepageTitle });
        const system = `You extract a company or product name from a homepage title.

## Task
- Analyze the provided homepage title and URL to derive the entity name.

## Guidelines
- Return the homepage title exactly as provided in the input.
- Extract the brand or product name from the title; if unclear, return an empty string.

## Expectations
- Provide concise, exact values without extra commentary.`;

        const { experimental_output } = await generateText({
          model: google("gemini-3-flash-preview"),
          system,
          prompt: `Context:
URL: ${project.websiteUrl}
Homepage Title: ${homepageTitle}

Extract the name from the above context.`,

          experimental_output: Output.object({
            schema: jsonSchema<{ name: string }>(
              type({
                name: "string",
              }).toJsonSchema() as JSONSchema7,
            ),
          }),
        });

        return experimental_output;
      },
    );

    await step.do("update project name/slug from homepage title", async () => {
      const extractedName = name.trim();
      const nextName = extractedName || project.name;
      const nextSlug = extractedName ? toSlug(extractedName) : project.slug;

      if (!extractedName) {
        return { name: nextName, slug: nextSlug, updated: false };
      }

      logInfo("updating project name", {
        projectId: project.id,
        name: nextName,
        slug: nextSlug,
      });
      const db = createDb();
      const updateResult = await updateSeoProject(db, {
        id: project.id,
        organizationId: project.organizationId,
        name: nextName,
        slug: nextSlug ?? project.slug,
      });

      if (!updateResult.ok) {
        logError("failed to update project name", {
          projectId: project.id,
          error: updateResult.error,
        });
        throw updateResult.error;
      }

      return { name: nextName, slug: nextSlug, updated: true };
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

        logInfo("researching business background", {
          projectId: project.id,
          websiteUrl: project.websiteUrl,
        });
        // biome-ignore lint/suspicious/noExplicitAny: lazy
        const outputResult = await safe<any>(() =>
          generateText({
            model: openai("gpt-5.2"),
            system,
            tools,
            prompt: `Extract business background and blog tone from: ${project.websiteUrl}`,
            stopWhen: [stepCountIs(35)],
            onStepFinish: (step) => {
              logInfo("step finished", {
                toolCalls: step.toolCalls,
                toolResults: step.toolResults,
              });
            },
            experimental_output: Output.object({
              schema: jsonSchema<
                type.infer<typeof seoUnderstandSiteTaskOutputSchema>
              >(
                seoUnderstandSiteTaskOutputSchema.toJsonSchema() as JSONSchema7,
              ),
            }),
          }),
        );
        logInfo("research result", { outputResult });
        if (!outputResult.ok) {
          logError("failed to research business background", {
            projectId: project.id,
            error: outputResult.error,
          });
          throw outputResult.error;
        }

        return outputResult.value;
      },
    );

    await step.do("update project with research results", async () => {
      const brandVoiceFromSamples = researchResult.brandVoice.trim() || "";

      const nextBrandVoice = `## Writing Tone
${brandVoiceFromSamples}

## Writing Guidelines
${DEFAULT_BRAND_VOICE}`;

      logInfo("updating project with research results", {
        projectId: project.id,
        businessBackground: researchResult.businessBackground,
        brandVoice: nextBrandVoice,
      });
      const db = createDb();
      const updateResult = await updateSeoProject(db, {
        id: project.id,
        organizationId: project.organizationId,
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
    });

    return {
      ...researchResult,
      name,
    } satisfies typeof seoUnderstandSiteTaskOutputSchema.infer;
  }
}
