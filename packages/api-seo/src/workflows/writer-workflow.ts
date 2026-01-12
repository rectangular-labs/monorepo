import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { type GoogleGenerativeAIProviderOptions, google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";
import type {
  seoWriteArticleTaskInputSchema,
  seoWriteArticleTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb, type schema } from "@rectangular-labs/db";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  Output,
  stepCountIs,
} from "ai";
import { type } from "arktype";
import { createImageToolsWithMetadata } from "../lib/ai/tools/image-tools";
import { createInternalLinksToolWithMetadata } from "../lib/ai/tools/internal-links-tool";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "../lib/ai/tools/todo-tool";
import { createWebToolsWithMetadata } from "../lib/ai/tools/web-tools";
import { buildWriterSystemPrompt } from "../lib/ai/writer-agent";
import { createPublicImagesBucket } from "../lib/bucket";
import { ensureDraftForSlug, normalizeContentSlug } from "../lib/content";
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
  primaryKeyword?: string | null;
  notes?: string | null;
  outline?: string | null;
}): Promise<ArticleType> {
  const { primaryKeyword, notes, outline } = args;
  if (!primaryKeyword && !outline && !notes) return "other";

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
- Use "other" if none apply.

<primary_keyword>
${primaryKeyword ?? ""}
</primary_keyword>

<notes>
${notes ?? ""}
</notes>

<outline>
${outline ?? ""}
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
    return result.experimental_output.articleType;
  } catch (error) {
    logError("failed to infer article type; defaulting to other", {
      error,
    });
    return "other";
  }
}

type DraftRecord = typeof schema.seoContentDraft.$inferSelect;
type ProjectRecord = Omit<
  typeof schema.seoProject.$inferSelect,
  "serpSnapshot"
>;

async function loadDraftAndProject(args: {
  db: ReturnType<typeof createDb>;
  organizationId: string;
  projectId: string;
  chatId?: string | null;
  path: string;
  userId?: string | null;
}): Promise<{
  draft: DraftRecord;
  project: ProjectRecord;
  slug: string;
}> {
  const slug = normalizeContentSlug(args.path);
  if (!slug) {
    throw new Error(`Invalid content path: ${args.path}`);
  }

  const draftResult = await ensureDraftForSlug({
    db: args.db,
    organizationId: args.organizationId,
    projectId: args.projectId,
    slug,
    originatingChatId: args.chatId ?? null,
    userId: args.userId ?? null,
  });
  if (!draftResult.ok) {
    throw new Error(draftResult.error.message);
  }
  if (draftResult.value.draft.status === "deleted") {
    throw new Error(`Draft (${slug}) is marked as deleted.`);
  }

  const project = await args.db.query.seoProject.findFirst({
    where: (table, { and, eq }) =>
      and(
        eq(table.id, args.projectId),
        eq(table.organizationId, args.organizationId),
      ),
  });
  if (!project) {
    throw new Error(`Project (${args.projectId}) not found`);
  }

  return { draft: draftResult.value.draft, project, slug };
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
      path: input.path,
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
          chatId: input.chatId,
          path: input.path,
          userId: input.userId ?? null,
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
            path: input.path,
            callbackInstanceId: event.instanceId,
            userId: input.userId,
          },
          workflowInstanceId: `child-${event.instanceId}_${crypto.randomUUID().slice(0, 5)}`,
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

    await step.do("mark writing", async () => {
      const db = createDb();
      const writeResult = await writeContentDraft({
        db,
        chatId: input.chatId ?? null,
        userId: input.userId ?? null,
        project: {
          id: input.projectId,
          publishingSettings: null,
          organizationId: input.organizationId,
        },
        createIfNotExists: true,
        lookup: { type: "slug", slug: input.path },
        draftNewValues: {
          slug: input.path,
          status: "writing",
        },
      });
      if (!writeResult.ok) throw new Error(writeResult.error.message);
    });
    logInfo("status set to writing", {
      instanceId: event.instanceId,
      path: input.path,
    });
    try {
      const { text: articleMarkdown, articleType } = await step.do(
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
            chatId: input.chatId,
            path: input.path,
            userId: input.userId ?? null,
          });

          const webTools = createWebToolsWithMetadata(project, this.env.CACHE);

          const imageTools = createImageToolsWithMetadata({
            organizationId: input.organizationId,
            projectId: input.projectId,
            imageSettings: project.imageSettings ?? null,
            publicImagesBucket: createPublicImagesBucket(),
          });
          const internalLinksTools = createInternalLinksToolWithMetadata(
            project.websiteUrl,
          );
          const todoTool = createTodoToolWithMetadata({ messages: [] });

          logInfo("writer tools ready", {
            instanceId: event.instanceId,
            path: input.path,
            webToolCount: Object.keys(webTools.tools).length,
            imageToolCount: Object.keys(imageTools.tools).length,
          });

          const outline = draft.outline;
          const primaryKeyword = draft.primaryKeyword;
          const notes = draft.notes;
          const articleType = await inferArticleType({
            primaryKeyword,
            notes,
            outline,
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
            path: input.path,
          });
          let approved = false;
          let changes: string[] = [];
          let attempts = 0;
          let text = "";
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
                ...internalLinksTools.tools,
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

            const repairedLinks = repairPublicBucketImageLinks({
              markdown: result.text.trim(),
              orgId: input.organizationId,
              projectId: input.projectId,
              kind: "content-image",
            });
            text = repairedLinks.markdown;
            if (!text) throw new Error("Empty article returned by model");
            logInfo("article generated. Going through review process.", {
              instanceId: event.instanceId,
              path: input.path,
              articleChars: text.length,
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
  - Exactly 1 hero image.
    - There should be no placeholder blockquote line that mentions "Hero image".
    - If no marker exists, treat the only image before the first H2 as hero (if exactly one exists).
    - Otherwise, treat the first image in the document as hero.
  - At least 1 non-hero image inside an H2 section (an H2 section that contains an image other than the hero image).
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
                  path: input.path,
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
              path: input.path,
              approved,
              changes,
            });
          }
          return { text, articleType };
        },
      );

      await step.do("Save article to file and update status", async () => {
        const db = createDb();
        const { project } = await loadDraftAndProject({
          db,
          organizationId: input.organizationId,
          projectId: input.projectId,
          chatId: input.chatId,
          path: input.path,
          userId: input.userId ?? null,
        });
        const writeResult = await writeContentDraft({
          db,
          chatId: input.chatId ?? null,
          userId: input.userId ?? null,
          project: {
            id: input.projectId,
            publishingSettings: project.publishingSettings ?? null,
            organizationId: input.organizationId,
          },
          createIfNotExists: true,
          lookup: { type: "slug", slug: input.path },
          draftNewValues: {
            slug: input.path,
            contentMarkdown: articleMarkdown,
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
        path: input.path,
      });
      return {
        type: "seo-write-article",
        path: input.path,
        content: articleMarkdown,
        articleType,
      } satisfies typeof seoWriteArticleTaskOutputSchema.infer;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      logError("generation failed", {
        instanceId: event.instanceId,
        path: input.path,
        message,
      });

      throw e;
    }
  }
}
