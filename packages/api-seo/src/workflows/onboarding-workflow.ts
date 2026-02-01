import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { google } from "@ai-sdk/google";
import { openai } from "@ai-sdk/openai";
import { toSlug } from "@rectangular-labs/core/format/to-slug";
import {
  type seoUnderstandSiteTaskInputSchema,
  seoUnderstandSiteTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb } from "@rectangular-labs/db";
import { updateSeoProject } from "@rectangular-labs/db/operations";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { createTask } from "../lib/task";
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

    const [{ name }, businessBackground] = await Promise.all([
      step.do(
        "extract project name from homepage title",
        {
          timeout: "5 minutes",
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
      ),
      step.do(
        "research business background",
        {
          timeout: "30 minutes",
        },
        async () => {
          const { tools } = createWebToolsWithMetadata(project, this.env.CACHE);
          const system = `You are an SEO research expert extracting concise, high-signal business context.

## Task
- Research the provided website to extract business context, target audience, competitors and content strategy insights.

## Guidelines
- Use ONLY the web_search and web_fetch tools to gather information. We want to make sure that the date is accurate and up to date at all times.
- Prioritize the site's own pages over external sources.
- Be conservative and never guess. Only report verified information that is publicly stated.
- If uncertain about location or language, use schema defaults (US, San Francisco, en).

## Expectations
- All information must be current and up to date.
- Provide clear and concise, high-signal insights rather than verbose descriptions.`;

          logInfo("researching business background", {
            projectId: project.id,
            websiteUrl: project.websiteUrl,
          });
          const outputResult = await generateText({
            model: openai("gpt-5.2"),
            system,
            tools,
            prompt: `Extract business background from: ${project.websiteUrl}`,
            stopWhen: [stepCountIs(35)],
            onStepFinish: (step) => {
              logInfo("[backgroundResearch] step finished", {
                toolCalls: step.toolCalls,
                toolResults: step.toolResults,
              });
            },
            experimental_output: Output.object({
              schema: jsonSchema<
                type.infer<
                  typeof seoUnderstandSiteTaskOutputSchema
                >["businessBackground"]
              >(
                seoUnderstandSiteTaskOutputSchema
                  .get("businessBackground")
                  .toJsonSchema() as JSONSchema7,
              ),
            }),
          });

          return outputResult.experimental_output;
        },
      ),
    ]);

    await step.do(
      "update project name/slug and business background",
      async () => {
        const extractedName = name.trim();
        const nextName = extractedName || project.name;
        const nextSlug = extractedName ? toSlug(extractedName) : project.slug;
        logInfo("updating project name and saving business background", {
          projectId: project.id,
          name: nextName,
          slug: nextSlug,
        });

        const db = createDb();
        const updateResult = await updateSeoProject(db, {
          id: project.id,
          organizationId: project.organizationId,
          name: nextName,
          slug: nextSlug,
          businessBackground: {
            ...businessBackground,
            version: "v1",
          },
        });

        if (!updateResult.ok) {
          logError("failed to update project name and business background", {
            projectId: project.id,
            error: updateResult.error,
          });
          throw updateResult.error;
        }
      },
    );

    await step.do("trigger strategy suggestions workflow", async () => {
      const db = createDb();
      const taskResult = await createTask({
        db,
        userId: undefined,
        input: {
          type: "seo-generate-strategy-suggestions",
          projectId: project.id,
        },
        workflowInstanceId: `strategy_${event.instanceId}_${crypto.randomUUID().slice(0, 5)}`,
      });
      if (!taskResult.ok) {
        logError("failed to trigger strategy suggestions workflow", {
          projectId: project.id,
          error: taskResult.error,
        });
      }
    });

    const brandVoiceResult = await step.do(
      "generate brand voice",
      { timeout: "10 minutes" },
      async () => {
        const { tools } = createWebToolsWithMetadata(project, this.env.CACHE);
        const system = `You are an SEO research expert extracting a brand's writing tone.

## Task
- Find 3-5 blog/article URLs from the SAME DOMAIN as the website to analyze writing tone.
- Summarize the writing tone based on actual blog samples found to provide a concrete voice for new articles.

## Guidelines
- Use ONLY the web_search and web_fetch tools to gather information.
- Prioritize the site's own pages over external sources.
- Be conservative and never guess. Only report verified information that is publicly stated.
- You are encouraged to include writing examples to showcase what you mean when you describe various aspects of the brand voice. 
    - For example if you say that the brand is authoritative and neutral, add <examples blogSource="blogURL">{QUOTE_FROM_BLOG}</examples>
- If no blog samples exist, return an empty string for brandVoice.

## Expectations
- Provide clear and concise tone attributes.`;

        logInfo("researching brand voice", {
          projectId: project.id,
          websiteUrl: project.websiteUrl,
        });
        const outputResult = await generateText({
          model: openai("gpt-5.2"),
          system,
          tools,
          prompt: `Extract brand voice from: ${project.websiteUrl}`,
          stopWhen: [stepCountIs(25)],
          onStepFinish: (step) => {
            logInfo("step to extract brand voice finished", {
              toolCalls: step.toolCalls,
              toolResults: step.toolResults,
            });
          },
          experimental_output: Output.object({
            schema: jsonSchema<{ brandVoice: string }>(
              type({
                brandVoice: "string",
              }).toJsonSchema() as JSONSchema7,
            ),
          }),
        });

        return outputResult.experimental_output;
      },
    );

    const { brandVoice } = await step.do(
      "update project brand voice",
      async () => {
        const brandVoiceFromSamples = brandVoiceResult.brandVoice.trim() || "";
        const nextBrandVoice = `${
          brandVoiceFromSamples
            ? `## Writing Tone
  
${brandVoiceFromSamples}
`
            : ""
        }
## Writing Guidelines

${DEFAULT_BRAND_VOICE}`;
        const db = createDb();
        const updateResult = await updateSeoProject(db, {
          id: project.id,
          organizationId: project.organizationId,
          writingSettings: {
            ...project.writingSettings,
            brandVoice: nextBrandVoice,
          },
        });

        if (!updateResult.ok) {
          logError("failed to update project brand voice", {
            projectId: project.id,
            error: updateResult.error,
          });
          throw updateResult.error;
        }

        return { brandVoice: nextBrandVoice };
      },
    );

    return {
      type: "seo-understand-site",
      name,
      businessBackground,
      brandVoice,
    } satisfies typeof seoUnderstandSiteTaskOutputSchema.infer;
  }
}
