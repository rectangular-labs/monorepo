import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { searchItemSchema } from "@rectangular-labs/core/schemas/keyword-parsers";
import type {
  seoPlanKeywordTaskInputSchema,
  seoPlanKeywordTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { fetchSerp } from "@rectangular-labs/dataforseo";
import type { schema } from "@rectangular-labs/db";
import { writeToFile } from "@rectangular-labs/loro-file-system";
import { err, ok, type Result, safe } from "@rectangular-labs/result";
import { generateText, stepCountIs } from "ai";
import type { type } from "arktype";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "../lib/ai/tools/todo-tool";
import {
  configureDataForSeoClient,
  fetchWithCache,
  getLocationAndLanguage,
  getSerpCacheKey,
} from "../lib/dataforseo/utils";
import {
  loadWorkspaceForWorkflow,
  persistWorkspaceSnapshot,
} from "../lib/workspace/workflow";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoPlannerWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoPlannerWorkflow] ${message}`, data ?? {});
}

async function generateOutline({
  project,
  notes,
  primaryKeyword,
  locationName,
  languageCode,
  serp,
}: {
  project: Omit<typeof schema.seoProject.$inferSelect, "serpSnapshot">;
  notes?: string;
  primaryKeyword: string;
  locationName: string;
  languageCode: string;
  serp: (typeof searchItemSchema.infer)[];
}): Promise<Result<string, Error>> {
  const system = `<role>
You are an expert SEO article researcher and strategist. Your job is to produce a writer-ready plan and outline for the BEST possible article for the target keyword. You MUST synthesize findings from the, competitor pages, and PAA/related searches/AI overview 

The goal is to create a plan that a writer can follow to:
1. Outranks the current top 10 SERP results
2. Gets featured in AI Overviews and answer boxes
3. Drives organic traffic and conversions
4. Establishes E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for the site ${project.websiteUrl}.
</role>

<critical-requirements>
- The final artifact MUST be a cohesive plan that a writer can follow end-to-end.
- The plan MUST include a concrete title and a H2/H3 outline with section-by-section notes (what to say, what to cite, and any unique angle to add).
- Prefer tool-grounded claims. When you cite stats or claims, have the claims be in the anchor text of the source URL itself.
  <example>
  According to the [Harvard Business Review](url_link), the most successful companies of the future will be those that can innovate fast.
  </example>
  <example>
  Up to [20% of companies](url_link) will be disrupted by AI in the next 5 years.
  </example>
- Use internal_links to propose 5-10 highly relevant internal links to include (and suggested anchor text).
  <example>
  When thinking about [process automation](/path/to/process-automation-article), you should focus on final payoff instead of the initial setup.
  </example>
</critical-requirements>

<workflow>
1) Analyze intent and SERP features (AI overview, PAA, related searches) for the keyword (provided in live-serp-data).
2) Analyze competitor pages: what they cover well, gaps, structure patterns, and differentiators (also provided in live-serp-data).
3) Gather sources: use google_search (and optionally url_context) for fresh stats, studies, definitions, and quotes.
4) Synthesize into a brief article outline. Include a section on the POV of the article and a section covering any relevant assets that would be useful to include (tables/diagrams/site screenshots/flow charts/etc.).
    - The plan should follow closely the structure of competitor pages ${serp.find((s) => s.type === "ai_overview") ? "and the AI Overview" : ""} while also adding unique insights and angles. Note that if none of the competitors page fulfill/matches the target keyword well, you are free to ignore the competitors page structure.
    - Add in a target word count to the plan so the writer knows how much to write. (In general, articles should be no more than 1.2k words unless asked to write more.)
    - Only suggest FAQ sections if the People Also Ask data is available. Use the People Also Ask data to guide the FAQ sections and limit 5 questions maximum unless asked to write more. 
    - Use the related_searches to suggest semantic variations and LSI keywords to naturally insert in various sections.
    - Include any relevant stats that we should cite or internal links to relevant articles that we should link to.
5) Output the file in markdown format, do not include any other formatting or commentary.
</workflow>

<project context>
- Website: ${project.websiteUrl}
- Primary keyword: ${primaryKeyword}
- Target country: ${locationName}
- Target language: ${languageCode}
</project context>


<live-serp-data>
${JSON.stringify(serp, null, 2)}
</live-serp-data>`;

  const todoTool = createTodoToolWithMetadata({ messages: [] });
  const result = await safe(() =>
    generateText({
      model: google("gemini-3-flash-preview"),
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
        url_context: google.tools.urlContext({}),
        google_search: google.tools.googleSearch({}),
        ...todoTool.tools,
      },
      system,
      messages: [
        {
          role: "user",
          content: `Generate the outline for the primary keyword: ${primaryKeyword}. The output must be only the markdown outline plan (no extra commentary). ${notes ? `Here are some notes about the article that I want you to consider: ${notes}` : ""}`,
        },
      ],
      onStepFinish: (step) => {
        logInfo(`[generateOutline] Step completed:`, {
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
      stopWhen: [stepCountIs(25)],
    }),
  );
  if (!result.ok) return err(result.error);
  const outline = result.value.text.trim();
  if (!outline) return err(new Error("Empty outline returned by model"));
  return ok(outline);
}

type PlannerInput = type.infer<typeof seoPlanKeywordTaskInputSchema>;
export class SeoPlannerWorkflow extends WorkflowEntrypoint<
  {
    SEO_WRITER_WORKFLOW: InitialContext["seoWriterWorkflow"];
    CACHE: KVNamespace;
  },
  PlannerInput
> {
  fetchSerpWithCache = async (
    keyword: string,
    locationName: string,
    languageCode: string,
  ) => {
    const serpKey = getSerpCacheKey(keyword, locationName, languageCode);
    const serpResult = await fetchWithCache({
      key: serpKey,
      fn: async () => {
        const result = await fetchSerp({
          keyword,
          locationName,
          languageCode,
        });
        if (!result.ok) throw result.error;
        return result.value;
      },
      cacheKV: this.env.CACHE,
    });
    return serpResult;
  };
  async run(event: WorkflowEvent<PlannerInput>, step: WorkflowStep) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      path: input.path,
      organizationId: input.organizationId,
      projectId: input.projectId,
      campaignId: input.campaignId,
      hasCallbackInstanceId: Boolean(input.callbackInstanceId),
    });
    configureDataForSeoClient();

    try {
      const {
        serpKey,
        primaryKeyword,
        locationName,
        languageCode,
        project,
        notes,
      } = await step.do("fetch SERP for keyword", async () => {
        const workspaceResult = await loadWorkspaceForWorkflow({
          organizationId: input.organizationId,
          projectId: input.projectId,
          campaignId: input.campaignId,
          path: input.path,
        });
        if (!workspaceResult.ok) throw workspaceResult.error;
        const { node, project } = workspaceResult.value;

        const { locationName, languageCode } = getLocationAndLanguage(project);
        const primaryKeyword = node.data.get("primaryKeyword");
        if (!primaryKeyword) {
          throw new NonRetryableError(
            `Primary keyword not found for ${input.path}`,
          );
        }
        const serpKey = getSerpCacheKey(
          primaryKeyword,
          locationName,
          languageCode,
        );
        const serpResult = await this.fetchSerpWithCache(
          primaryKeyword,
          locationName,
          languageCode,
        );
        if (!serpResult.ok) throw serpResult.error;
        return {
          serpKey,
          primaryKeyword,
          locationName,
          languageCode,
          project,
          notes: node.data.get("notes"),
        };
      });

      logInfo("inputs ready", {
        instanceId: event.instanceId,
        path: input.path,
        serpKey,
        primaryKeyword,
        locationName,
        languageCode,
        hasNotes: Boolean(notes?.trim()),
      });

      const outline = await step.do(
        "generate outline",
        {
          timeout: "30 minutes",
        },
        async () => {
          logInfo("fetching SERP (cached) for outline", {
            instanceId: event.instanceId,
            serpKey,
            primaryKeyword,
            locationName,
            languageCode,
          });

          const serp = await this.fetchSerpWithCache(
            primaryKeyword,
            locationName,
            languageCode,
          );
          if (!serp.ok) {
            throw serp.error;
          }

          logInfo("generating outline", {
            instanceId: event.instanceId,
            path: input.path,
            primaryKeyword,
            serpItems: serp.value,
          });

          const result = await generateOutline({
            project,
            notes,
            primaryKeyword,
            locationName,
            languageCode,
            serp: serp.value.searchResult,
          });
          if (!result.ok) throw result.error;
          const outline = result.value;
          logInfo("outline generated", {
            instanceId: event.instanceId,
            path: input.path,
            outlineChars: outline.length,
          });
          return outline;
        },
      );

      await step.do("store outline in node", async () => {
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
          metadata: [{ key: "outline", value: outline }],
        });
        if (!writeResult.success) throw new Error(writeResult.message);
        const persistResult = await persistWorkspaceSnapshot({
          loroDoc,
          workspaceBlobUri,
        });
        if (!persistResult.ok) throw persistResult.error;
      });

      logInfo("outline stored", {
        instanceId: event.instanceId,
        path: input.path,
      });

      const { callbackInstanceId } = input;
      if (callbackInstanceId) {
        await step.do("notify callback workflow", async () => {
          const instance =
            await this.env.SEO_WRITER_WORKFLOW.get(callbackInstanceId);
          await instance.sendEvent({
            type: "planner.complete",
            payload: { path: input.path },
          });
        });
        logInfo("callback notified", {
          instanceId: event.instanceId,
          path: input.path,
          callbackInstanceId,
        });
      } else {
        logInfo("no callbackInstanceId, skipping notify", {
          instanceId: event.instanceId,
          path: input.path,
        });
      }

      logInfo("complete", {
        instanceId: event.instanceId,
        path: input.path,
      });

      return {
        type: "seo-plan-keyword",
        path: input.path,
        outline,
      } satisfies typeof seoPlanKeywordTaskOutputSchema.infer;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      logError("failed", {
        instanceId: event.instanceId,
        path: input.path,
        message,
      });
      throw error;
    }
  }
}
