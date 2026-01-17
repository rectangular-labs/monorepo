import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";
import type {
  seoWriteArticleTaskInputSchema,
  seoWriteArticleTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb, type schema } from "@rectangular-labs/db";
import {
  getDraftById,
  getSeoProjectByIdentifierAndOrgId,
} from "@rectangular-labs/db/operations";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
import { createImageToolsWithMetadata } from "../lib/ai/tools/image-tools";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "../lib/ai/tools/todo-tool";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { buildWriterSystemPrompt } from "../lib/ai/writer-agent";
import { createPublicImagesBucket } from "../lib/bucket";
import {
  analyzeArticleMarkdownForReview,
  repairPublicBucketImageLinks,
} from "../lib/content/review-utils";
import { writeContentDraft } from "../lib/content/write-content-draft";
import { configureDataForSeoClient } from "../lib/dataforseo/utils";
import { createTask } from "../lib/task";
import {
  ARTICLE_TYPE_TO_WRITER_RULE,
  type ArticleType,
} from "../lib/workspace/workflow.constant";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoWriterWorkflow] ${message}`, data ?? {});
}

function logError(message: string, data?: Record<string, unknown>) {
  console.error(`[SeoWriterWorkflow] ${message}`, data ?? {});
}

const reviewArticleOutputSchema = type({
  approved: type("boolean").describe("Whether the article is approved."),
  changes: type("string[]").describe("Changes to be made to the article."),
});

const inferArticleTypeSchema = type({
  articleType: articleTypeSchema,
}).describe("Chosen article type for the content");

async function inferArticleType(args: {
  title?: string | null;
  primaryKeyword?: string | null;
  notes?: string | null;
  outline?: string | null;
}): Promise<ArticleType> {
  const { title, primaryKeyword, notes, outline } = args;
  if (!title && !primaryKeyword && !outline && !notes) {
    logInfo("inferred article type defaulted", {
      articleType: "other",
      title,
      primaryKeyword,
    });
    return "other";
  }

  const titleText = title?.toLowerCase() ?? "";
  const keywordText = primaryKeyword?.toLowerCase() ?? "";
  const notesText = notes?.toLowerCase() ?? "";
  const outlineText = outline?.toLowerCase() ?? "";
  const combinedText = [titleText, keywordText].filter(Boolean).join("\n");

  const heuristicMatch = (() => {
    if (
      /\b(press release|press-release|press statement)\b/.test(combinedText)
    ) {
      return "press-release";
    }
    if (/\b(interview|q&a|q & a)\b/.test(combinedText)) {
      return "interview";
    }
    if (/\b(case study|case-study)\b/.test(combinedText)) {
      return "case-study";
    }
    if (/\b(whitepaper|white paper)\b/.test(combinedText)) {
      return "whitepaper";
    }
    if (/\b(infographic)\b/.test(combinedText)) {
      return "infographic";
    }
    if (/\b(product update|release notes|changelog)\b/.test(combinedText)) {
      return "product-update";
    }
    if (/\b(event recap|recap|conference recap)\b/.test(combinedText)) {
      return "event-recap";
    }
    if (/\b(research summary|research roundup)\b/.test(combinedText)) {
      return "research-summary";
    }
    if (/\b(contest|giveaway)\b/.test(combinedText)) {
      return "contest-giveaway";
    }
    if (
      /\b(best|top|must-read|must read|ranking|ranked|top \d+|top-\d+)\b/.test(
        combinedText,
      )
    ) {
      return "best-of-list";
    }
    if (
      /\b(vs\.?|versus|comparison|compare|alternatives?)\b/.test(combinedText)
    ) {
      return "comparison";
    }
    if (/\b(pricing|price|cost|rates|fees|plans)\b/.test(combinedText)) {
      return "comparison";
    }
    if (
      /\b(how to|step-by-step|step by step|tutorial|guide)\b/.test(combinedText)
    ) {
      return "how-to";
    }
    if (
      /\b(faq|frequently asked questions|frequently asked question|frequently ask questions|frequently ask question)\b/.test(
        combinedText,
      )
    ) {
      return "faq";
    }
    if (/\b(news|announcement|breaking)\b/.test(combinedText)) {
      return "news";
    }
    if (/\b(best practice|best-practice)\b/.test(combinedText)) {
      return "best-practices";
    }
    if (/\b(list of|checklist|tips|ideas)\b/.test(combinedText)) {
      return "listicle";
    }
    return null;
  })();
  if (heuristicMatch) {
    logInfo("inferred article type via heuristic", {
      articleType: heuristicMatch,
      title,
      primaryKeyword,
    });
    return heuristicMatch;
  }

  const prompt = `Choose the single best article type for the intended content.

Return ONLY JSON matching: { "articleType": string }

"articleType" must be one of:
- "best-of-list"
- "comparison"
- "how-to"
- "listicle"
- "long-form-opinion"
- "faq"
- "news"
- "whitepaper"
- "infographic"
- "case-study"
- "press-release"
- "interview"
- "product-update"
- "contest-giveaway"
- "research-summary"
- "event-recap"
- "best-practices"
- "other"

Decision rules:
- If notes clearly specify a format (e.g. "press release", "interview", "case study"), prioritize notes over outline.
- If the outline structure signals a format (steps, Q&A headings, comparisons, rankings), match it.
- Use "best-of-list" only for explicit "best/top" ranking intent; otherwise use "listicle" for general lists.
- Pricing, cost, or rate-focused titles usually map to "comparison".
- Use your reasoning and judgement to discern between the other article types. use "other" if none of the article types apply.

<title>
${titleText ?? ""}
</title>

<primary_keyword>
${keywordText ?? ""}
</primary_keyword>

<notes>
${notesText ?? ""}
</notes>

<outline>
${outlineText ?? ""}
</outline>`;

  try {
    const result = await generateText({
      model: google("gemini-3-flash-preview"),
      experimental_output: Output.object({
        schema: jsonSchema<typeof inferArticleTypeSchema.infer>(
          // Google api doesn't support const keyword in json schema for anyOf, only string.
          JSON.parse(
            JSON.stringify(inferArticleTypeSchema.toJsonSchema()).replaceAll(
              "enum",
              'type":"string","enum',
            ),
          ) as JSONSchema7,
        ),
      }),
      prompt,
    });
    const inferred = result.experimental_output.articleType;
    logInfo("inferred article type via model", {
      articleType: inferred,
      title,
      primaryKeyword,
    });
    return inferred;
  } catch (error) {
    logError("failed to infer article type; defaulting to other", {
      error,
    });
    logInfo("inferred article type defaulted", {
      articleType: "other",
      title,
      primaryKeyword,
    });
    return "other";
  }
}

async function loadDraftAndProject(args: {
  db: ReturnType<typeof createDb>;
  organizationId: string;
  projectId: string;
  draftId: string;
}): Promise<{
  draft: typeof schema.seoContentDraft.$inferSelect;
  project: typeof schema.seoProject.$inferSelect;
}> {
  const draftResult = await getDraftById({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    id: args.draftId,
  });
  if (!draftResult.ok) {
    throw new NonRetryableError(draftResult.error.message);
  }
  if (!draftResult.value) {
    throw new NonRetryableError(`Draft not found for ${args.draftId}`);
  }
  const draft = draftResult.value;

  const projectResult = await getSeoProjectByIdentifierAndOrgId(
    args.db,
    args.projectId,
    args.organizationId,
    {
      publishingSettings: true,
      writingSettings: true,
      imageSettings: true,
      businessBackground: true,
    },
  );
  if (!projectResult.ok) {
    throw new NonRetryableError(projectResult.error.message);
  }
  if (!projectResult.value) {
    throw new NonRetryableError(`Project (${args.projectId}) not found`);
  }
  const project = projectResult.value;

  return { draft, project };
}

type WriterInput = type.infer<typeof seoWriteArticleTaskInputSchema>;
export class SeoWriterWorkflow extends WorkflowEntrypoint<
  {
    SEO_PLANNER_WORKFLOW: InitialContext["seoPlannerWorkflow"];
    CACHE: InitialContext["cacheKV"];
  },
  WriterInput
> {
  async run(event: WorkflowEvent<WriterInput>, step: WorkflowStep) {
    const input = event.payload;

    logInfo("start", {
      instanceId: event.instanceId,
      draftId: input.draftId,
      organizationId: input.organizationId,
      projectId: input.projectId,
      chatId: input.chatId,
      userId: input.userId,
    });
    configureDataForSeoClient();

    const isOutlinePresent = await step.do(
      "Ensure outline is present",
      async () => {
        const db = createDb();
        const { draft } = await loadDraftAndProject({
          db,
          organizationId: input.organizationId,
          projectId: input.projectId,
          draftId: input.draftId,
        });
        const outline = draft.outline;
        if (outline) {
          return true;
        }
        const result = await createTask({
          db,
          input: {
            type: "seo-plan-keyword",
            projectId: input.projectId,
            organizationId: input.organizationId,
            chatId: input.chatId,
            draftId: input.draftId,
            callbackInstanceId: event.instanceId,
            userId: input.userId,
          },
          workflowInstanceId: `child-${event.instanceId}_${crypto.randomUUID().slice(0, 5)}`,
          userId: input.userId,
        });
        if (!result.ok) {
          logError("failed to create planner task", {
            instanceId: event.instanceId,
            draftId: input.draftId,
            error: result.error,
          });
          throw result.error;
        }
        return false;
      },
    );
    logInfo("outline check", {
      instanceId: event.instanceId,
      draftId: input.draftId,
      isOutlinePresent,
    });
    if (!isOutlinePresent) {
      logInfo("waiting for planner callback", {
        instanceId: event.instanceId,
        draftId: input.draftId,
      });
      const plannerEvent = await step.waitForEvent<{ draftId: string }>(
        "wait for planner callback",
        {
          type: "planner_complete",
          timeout: "1 hour",
        },
      );
      logInfo("received planner callback", {
        instanceId: event.instanceId,
        expectedDraftId: input.draftId,
        receivedDraftId: plannerEvent.payload.draftId,
      });
      if (plannerEvent.payload.draftId !== input.draftId) {
        logError("planner callback draftId mismatch", {
          instanceId: event.instanceId,
          expectedDraftId: input.draftId,
          receivedDraftId: plannerEvent.payload.draftId,
        });
        throw new Error(
          `Planner callback draftId mismatch: expected ${input.draftId}, got ${plannerEvent.payload.draftId}`,
        );
      }
    }

    await step.do("mark writing", async () => {
      const db = createDb();
      const writeResult = await writeContentDraft({
        db,
        chatId: input.chatId ?? null,
        userId: input.userId ?? null,
        projectId: input.projectId,
        organizationId: input.organizationId,
        lookup: { type: "id", id: input.draftId },
        draftNewValues: {
          status: "writing",
        },
      });
      if (!writeResult.ok) throw new Error(writeResult.error.message);
    });
    logInfo("status set to writing", {
      instanceId: event.instanceId,
      draftId: input.draftId,
    });
    try {
      const {
        text: articleMarkdown,
        articleType,
        heroImage,
        heroImageCaption,
      } = await step.do(
        "generate article markdown",
        {
          timeout: "30 minutes",
        },
        async () => {
          const db = createDb();
          const { project, draft } = await loadDraftAndProject({
            db,
            organizationId: input.organizationId,
            projectId: input.projectId,
            draftId: input.draftId,
          });

          const webTools = createWebToolsWithMetadata(project, this.env.CACHE);

          const imageTools = createImageToolsWithMetadata({
            organizationId: input.organizationId,
            projectId: input.projectId,
            imageSettings: project.imageSettings ?? null,
            publicImagesBucket: createPublicImagesBucket(),
          });
          const todoTool = createTodoToolWithMetadata({ messages: [] });

          logInfo("writer tools ready", {
            instanceId: event.instanceId,
            draftId: input.draftId,
            webToolCount: Object.keys(webTools.tools).length,
            imageToolCount: Object.keys(imageTools.tools).length,
          });

          const outline = draft.outline;
          const primaryKeyword = draft.primaryKeyword;
          const notes = draft.notes;
          const articleType =
            draft.articleType ??
            (await inferArticleType({
              title: draft.title,
              primaryKeyword,
              notes,
              outline,
            }));
          logInfo("article type resolved", {
            instanceId: event.instanceId,
            draftId: input.draftId,
            articleType,
            source: draft.articleType ? "draft" : "inferred",
          });
          const systemPrompt = buildWriterSystemPrompt({
            project,
            skillsSection: "",
            mode: "workflow",
            articleType,
            primaryKeyword,
            outline: outline ?? undefined,
          });

          logInfo("starting article generation", {
            instanceId: event.instanceId,
            draftId: input.draftId,
          });
          let approved = false;
          let changes: string[] = [];
          let attempts = 0;
          let text = "";
          let heroImage = "";
          let heroImageCaption: string | null = null;
          while (!approved && attempts < 3) {
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
                ...imageTools.tools,
                ...todoTool.tools,
              },
              system: systemPrompt,
              messages: [
                {
                  role: "user",
                  content: changes.length
                    ? `The article has been written and reviewed. Please refer to the original article and apply the changes to the article and return the updated article.
<original-article>
${text}
</original-article>

<changes>
${changes.join("\n")}
</changes>`
                    : "Write the full article now.",
                },
              ],
              experimental_output: Output.object({
                schema: jsonSchema<{
                  heroImage: string;
                  heroImageCaption: string | null;
                  markdown: string;
                }>(
                  type({
                    heroImage: "string",
                    heroImageCaption: "string|null",
                    markdown: "string",
                  }).toJsonSchema() as JSONSchema7,
                ),
              }),
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

            const outputMarkdown = result.experimental_output.markdown.trim();
            const repairedLinks = repairPublicBucketImageLinks({
              markdown: outputMarkdown,
              orgId: input.organizationId,
              projectId: input.projectId,
              kind: "content-image",
            });
            text = repairedLinks.markdown;
            heroImage = result.experimental_output.heroImage.trim();
            heroImageCaption =
              result.experimental_output.heroImageCaption?.trim() || null;
            if (!text) throw new Error("Empty article returned by model");
            logInfo("article generated. Going through review process.", {
              instanceId: event.instanceId,
              draftId: input.draftId,
              articleChars: text.length,
              heroImagePresent: !!heroImage,
              usage: result.usage ?? null,
              replacedCount: repairedLinks.replacedCount,
            });

            const articleTypeRule = articleType
              ? ARTICLE_TYPE_TO_WRITER_RULE[articleType]
              : undefined;

            const analysis = analyzeArticleMarkdownForReview({
              markdown: text,
              websiteUrl: project.websiteUrl,
              outline,
            });
            const utcDate = new Intl.DateTimeFormat("en-US", {
              timeZone: "UTC",
              year: "numeric",
              month: "long",
              day: "numeric",
            }).format(new Date());
            const { experimental_output: reviewResult } = await generateText({
              model: google("gemini-3-flash-preview"),
              providerOptions: {
                google: {
                  thinkingConfig: {
                    includeThoughts: true,
                    thinkingLevel: "medium",
                  },
                } satisfies GoogleGenerativeAIProviderOptions,
              },
              tools: {
                ...webTools.tools,
                ...todoTool.tools,
              },
              system: `<role>
You are a strict SEO content QA reviewer. Your job is to verify the writer followed ALL explicit rules and that the article is publish-ready.
</role>

<approval-policy>
- Only set approved=true when ALL requirements are satisfied.
- If ANY measurable requirement fails (counts, missing sections, forbidden characters), approved MUST be false.
- In changes, focus on concrete edits: what to add/remove/move, and exactly where (section names/headings).
</approval-policy>

<hard-requirements>
- Outline coverage: every outline heading (H2+) must exist in the article and be meaningfully covered.
- Internal links: at least 3 internal links (relative URLs and URLs whose host matches the website host count as internal).
- External links: at least 2 external links whose host is NOT the website host.
- Images:
  - At least 1 image inside an H2 section (an H2 section that contains an image).
  - All images must have non-empty, descriptive alt text.
- Formatting:
  - No em dashes (—) anywhere.
  - If bullet points are used, each bullet must start with a bold heading and a colon (e.g. "- **Heading**: ...").
- Article-type rule (if present) must be enforced.
</hard-requirements>

<link-verification>
- Use web_search and web_fetch to verify external links are accurate, relevant, and resolve to the intended content.
- If a link is broken, non-authoritative, or mismatched to the claim, propose a replacement URL and specify where to swap it in.
</link-verification>

<output>
Return JSON that matches the schema: { approved: boolean, changes: string[] }.
If not approved, changes must be a prioritized, actionable edit list (include observed counts and missing items).
</output>

<project-context>
- Today's date: ${utcDate} (UTC timezone)
- Website URL: ${project.websiteUrl}
- Article type: ${articleType ?? "(missing)"}
- Primary keyword: ${primaryKeyword ?? "(missing)"}
- Brand voice (must be followed): ${project.writingSettings?.brandVoice ?? "(missing)"}
- User instructions (must be followed): ${project.writingSettings?.customInstructions ?? "(missing)"}
${articleTypeRule ? `- Article-type rule:\n${articleTypeRule}` : ""}
</project-context>

<programmatic-analysis>
${JSON.stringify(analysis, null, 2)}
</programmatic-analysis>

<outline>
${outline ?? "(missing)"}
</outline>

<article-markdown>
${text}
</article-markdown>`,
              messages: [
                {
                  role: "user",
                  content: `Review the article against the requirements and return (approved, changes).`,
                },
              ],
              experimental_output: Output.object({
                schema: jsonSchema<typeof reviewArticleOutputSchema.infer>(
                  reviewArticleOutputSchema.toJsonSchema() as JSONSchema7,
                ),
              }),
              onStepFinish: (step) => {
                logInfo("review step completed", {
                  instanceId: event.instanceId,
                  draftId: input.draftId,
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
              stopWhen: [stepCountIs(20)],
            });
            ++attempts;
            ({ approved, changes } = reviewResult);
            logInfo("review result", {
              instanceId: event.instanceId,
              draftId: input.draftId,
              approved,
              changes,
            });
          }
          return { text, articleType, heroImage, heroImageCaption };
        },
      );

      await step.do("Save article to file and update status", async () => {
        const db = createDb();
        const { project } = await loadDraftAndProject({
          db,
          organizationId: input.organizationId,
          projectId: input.projectId,
          draftId: input.draftId,
        });
        const writeResult = await writeContentDraft({
          db,
          chatId: input.chatId,
          userId: input.userId ?? null,
          projectId: input.projectId,
          organizationId: input.organizationId,
          lookup: { type: "id", id: input.draftId },
          draftNewValues: {
            contentMarkdown: articleMarkdown,
            heroImage,
            heroImageCaption,
            status: project.publishingSettings?.requireContentReview
              ? "pending-review"
              : "scheduled",
            articleType,
          },
        });
        if (!writeResult.ok) throw new Error(writeResult.error.message);
      });
      logInfo("article saved", {
        instanceId: event.instanceId,
        draftId: input.draftId,
      });
      return {
        type: "seo-write-article",
        draftId: input.draftId,
        content: articleMarkdown,
        articleType,
        heroImage,
        heroImageCaption,
      } satisfies typeof seoWriteArticleTaskOutputSchema.infer;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      logError("generation failed", {
        instanceId: event.instanceId,
        draftId: input.draftId,
        message,
      });

      throw e;
    }
  }
}
