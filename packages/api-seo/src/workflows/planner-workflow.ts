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
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
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

type SearchItem = typeof searchItemSchema.infer;
async function addOrganicOutlinesToSerp({ serp }: { serp: SearchItem[] }) {
  const organicItems = serp.filter((item) => item.type === "organic");
  const organicForPrompt = organicItems.map((item) => ({
    title: item.title ?? "",
    url: item.url,
  }));
  if (organicForPrompt.length === 0) return serp;

  const serpValue = JSON.stringify(organicForPrompt);
  const prompt = `For each of the organic serp items, extract out the H2 and H3 to gather the outline of the article and return a JSON form in the form of { title: string, outline: string }[] where the outline is a markdown format of all the H2 and H3 extracted from the urls

Rules:
- Use the url_context tool for each URL to extract headings.
- Output must be ONLY valid JSON (no markdown, no commentary) matching exactly: { title: string, outline: string }[].
- Preserve the input order exactly and return the same number of items as provided in <serp>.
- If a URL is null or cannot be fetched, return an empty outline string for that item.
- The outline must be markdown headings only: use \\"##\\" for H2 and \\"###\\" for H3, in the order they appear on the page.
- Exclude navigation/footer/sidebar headings; include only main-article headings.

<serp>
${serpValue}
</serp>`;

  const schema = type({
    outlines: type({
      title: type("string").describe("The title of the SERP organic item"),
      outline: type("string").describe("The outline of the SERP organic item"),
    })
      .array()
      .describe(
        "SERP organic outlines: { title: string, outline: string }[] where outline is markdown headings",
      ),
  });
  const extraction = await safe(() =>
    generateText({
      model: google("gemini-3-flash-preview"),
      tools: {
        url_context: google.tools.urlContext({}),
      },
      prompt,
      stopWhen: [stepCountIs(40)],
      experimental_output: Output.object({
        schema: jsonSchema<type.infer<typeof schema>>(
          schema.toJsonSchema() as JSONSchema7,
        ),
      }),
    }),
  );

  if (!extraction.ok) {
    logError("failed to extract competitor outlines from SERP urls", {
      error: extraction.error,
    });
    return serp;
  }

  const extracted = extraction.value.experimental_output.outlines;
  logInfo("SERP outlines extracted", {
    extracted,
  });

  let organicIdx = 0;
  return serp.map((item) => {
    if (item.type !== "organic") return item;

    const next = extracted[organicIdx];
    organicIdx += 1;

    return {
      ...item,
      outline: next?.outline?.trim() ? next.outline.trim() : null,
    };
  });
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
  serp: SearchItem[];
}): Promise<Result<string, Error>> {
  const haveAiOverview = serp.find((s) => s.type === "ai_overview");
  const system = `<role>
You are an expert SEO article researcher and strategist. Your job is to produce a writer-ready plan and outline for the BEST possible article for the target keyword. You MUST synthesize findings from competitor pages, people also ask questions, related searches, and AI overview should they exists. 

The goal is to create a plan that a writer can follow to:
1. Outranks the current top 10 SERP results
2. Gets featured in AI Overviews and answer boxes
3. Drives organic traffic and conversions
4. Establishes E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for the site ${project.websiteUrl}.

The way to do that is to focus on Search intent of the primary keyword: ${primaryKeyword}. The search intent what the user would expect to find when searching for this particular keyword. 

We identify the search intent of the primary keyword from the SERPs, your natural understanding of the primary keyword. Focus on the following when identifying the search intent:
1. what information the user is intending to extract from the query.
2. what they already know or are aware of (eg. are they aware of the existence of a product or solution, or not yet).
3. what they are not aware of.

Once the search intent is identified, the article should be focused on answering precisely it without delay, substantiated with all the information, evidence, explanation and sourcing arising from it. 

EVERYTHING in the article should be focused AND in service of the search intent.
</role>


<workflow>
1) Analyze search intent from the SERPs, your natural understanding of the primary keyword for the primary keyword ${primaryKeyword} (SERPs provided in live-serp-data). Use the SERP outline of competitors pages ${haveAiOverview ? "and the AI Overview" : ""} to find out 
  i) groups of information that is useful to the searcher
  ii) questions the searcher would find useful to be answered
  iii) how the article flows from one topic to another, and how it's segmented into sections
2) Analyze the SERPs titles, description, and url slugs 
  i) title - how to use the primary keyword in the title, phrase it to capture attention, and promise the searcher their search intent will be fulfilled
  ii) slug - the most efficient way to include keywords in the url
  iii) description - summarize content succinctly and accurately while stating the keyword
3) Gather sources: use google_search (and optionally url_context) for fresh stats, studies, definitions, and quotes.
4) Synthesize into a brief article outline. Follow the critical-plan-requirements and the project context.
5) Output the file in markdown format, do not include any other formatting or commentary.
6) If any of these article types are being written, follow these instructions. These instructions should override any contradicting instructions elsewhere. If the type of article being written is not listed here, ignore this list.

## Best of lists 
1. Always include screenshots or products of the products/websites/service pages/country/food/item that you are listing. 
2. Word light
3. Maximum of 20 total items

## Comparisons (comparing two or more products or services or items)
1. Always include comparison tables at the top of the article that summarizes the key points
2. Include screenshots or pictures of each item being compared


## How to (guide)
1. Include screenshots, diagrams, pictures for each step
2. Checklist should be included after the introduction to signpost the article 

## Listicle (generically)
1. Include screenshots, diagrams, for every listed item 
2. Maximum of 20 total items 
3. Word light - each listicle item should be a maximum of 50 words

## Long form - opinions
1. Clear opinion that should be reached at the end 
2. Must take a side and an opinion - strong POV

## FAQs (?)
1. Headings should be the questions
2. Short word counts

## News 
1. Structure should cover: i) what happened, ii) why it matters, iii) key details, iv) what's next (if applicable)

## Whitepapers
1. Diagrams, charts, and frameworks should be produced into images 
2. Long word count
3. Include an executive summary, data analysis, explain methodology, describe the issue

## Infographic
1. Visual output should incorporate all important elements - there should be a clear heading, with visuals which accompany and describe each heading, and corresponding words in bullet point
2. Visual should have a flow and not be overly complicated. 
3. Text should be readable
4. No need to use SERP data

## Case studies
1. Visuals of any data
2. Emphasize the experience of the user and emphasize how they were aided
3. Identify the person by name and position and state the company in the title
4. No need to use SERP data

## Press releases (news about the company)
1. Short word count
2. State details of the press release
3. Quotes from key personnel
4. No need to use SERP data

## Interviews
1. Picture of the person being interviewed 
2. Structured around the interview and the quotes received in the interview
3. Introduction setting the scene of the interview - who is being interviewed and what their position and experience is, and when it took place, where. Who was interviewing. 
4. No need to use SERP data

## product update
1. Word light 
2. Introduce the product and what it is 
3. Explain why this update is exciting and what it intends to fulfill
4. No need to use SERP data

## Contest/giveaway
1. Visual of a giveaway - describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close,how much it's worth and the product needs to be in the picture. Picture should be vibrant and exciting
2. Very word light 
3. No need to use SERP data

## Research summary
1. Charts, frameworks, diagrams describing the data is mandatory
2. Describe what was studied, key findings, and implications, if any. 
3. Any original opinions have to be clearly labelled as such

## Event recap
1. Picture of the event (prompt user for it)
2. Describe event highlights and takeaways
3. No need to use SERP data

## Best practices
1. Checklist at the end of the article summarizing all the best practices
2. State dos and don'ts 
</workflow>

<critical-plan-requirements>
- The plan should be targeted at solving for the main search intent of the reader for the primary keyword ${primaryKeyword}. Use the distilled information from competitor pages ${haveAiOverview ? "and the AI Overview" : ""} while also adding unique insights and angles to structure the overall article. Note that if NONE of the competitors page fulfill/matches the search intent of the primary keyword, you SHOULD ignore the competitors page structure.
- The final artifact MUST be a cohesive plan that a writer can follow end-to-end.
- Prefer tool-grounded claims. When you cite stats or claims, have the claims be in the anchor text and the link be the source URL itself in markdown link syntax.
- The plan MUST include a title and the description for the article, follow these rules:
  - Meta description (max 160 characters): clear, succinct, keyword-rich summary that directly signals the article fulfills the user's main search intent (what they want to learn/answer)
  - Title + meta title (max 60 characters): clear and enticing for the user to click on, includes the primary keyword once (natural/organic), and answers the search intent directly; do not append extra qualifiers (no "X, Y and Z" and no parentheses), just the title
- The plan MUST also include the H2/H3 outline with section-by-section notes (what to say, what to cite, and any unique angle to add).
  - Headings should always be clear, direct and succinct. Reader should be able to understand what the section is covering. 
  - First H2 - incredibly focused and targeted toward answering the main intent of the searcher
  - Most H2s should have the primary keyword ${primaryKeyword} naturally written into it
  - H3 be related to the H2, and to the point
- Introduction - maximum of two paragraph of 3 sentences long each. Should 
  1. intrigue the reader - why this is important for the reader and include any interesting stats
  2. contextualize the topic for the reader's search intent
  3. contextualize how this has been recently important and what recent developments in the space are (if applicable - i.e. if the topic has significant recent updates)
  4. summarize the topics that the article would cover 
- Add in a target word count to the plan so the writer knows how much to write.
  - Most articles should have a word count around 1,000 to 1,500 words. Long research pieces can have more, but 95% of articles should fall within 1,000 to 1,500 words. 
  - If there is a struggle to keep it below this word count, look to focus the article up, and talk about fewer ideas. 
- ONLY suggest FAQ sections IF the People Also Ask data is available. Use the People Also Ask data to guide the FAQ sections and limit 5 questions maximum unless asked to write more. 
  - short and to the point. No more than 2 sentences long.
  - answer the question directly, substantiated succinctly.
  - plug the service and product of the company by directly stating the company name, but only naturally and when relevant to the question posed. 
  - If there is NO SERP \`people_also_ask\` data, DO NOT include a FAQ section
- Use the related_searches to suggest semantic variations and LSI keywords to naturally insert in various sections.
- Include any relevant stats that we should cite or internal links to relevant articles that we should link to.
  <example>
    According to the [Harvard Business Review](url_link), the most successful companies of the future will be those that can innovate fast.
  </example>
  <example>
    Up to [20% of companies](url_link) will be disrupted by AI in the next 5 years.
  </example>
  - Use internal_links to propose 5-10 highly relevant internal links to include (and suggested anchor text) in markdown link syntax.
  <example>
    When thinking about [process automation](/path/to/process-automation-article), you should focus on final payoff instead of the initial setup.
  </example>
</critical-plan-requirements>


<project context>
- Website: ${project.websiteUrl}
- Primary keyword: ${primaryKeyword}
- Target country: ${locationName}
- Target language: ${languageCode}
</project context>


<live-serp-data>
${JSON.stringify(serp)}
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

          logInfo("Getting SERP outlines", {
            instanceId: event.instanceId,
            path: input.path,
            primaryKeyword,
            serpItems: serp.value,
          });

          const serpWithOutlines = await addOrganicOutlinesToSerp({
            serp: serp.value.searchResult,
          });

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
            serp: serpWithOutlines,
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
            type: "planner_complete",
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
