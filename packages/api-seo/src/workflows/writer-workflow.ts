import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { NonRetryableError } from "cloudflare:workflows";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { ARTICLE_TYPES } from "@rectangular-labs/core/schemas/content-parsers";
import type {
  seoWriteArticleTaskInputSchema,
  seoWriteArticleTaskOutputSchema,
} from "@rectangular-labs/core/schemas/task-parsers";
import { createDb, type schema } from "@rectangular-labs/db";
import {
  getDraftById,
  getSeoProjectByIdentifierAndOrgId,
  getStrategyDetails,
} from "@rectangular-labs/db/operations";
import { generateText, jsonSchema, Output } from "ai";
import type { type } from "arktype";
import {
  createWriterPipeline,
  type StrategyContext,
} from "../lib/ai/agents/writer";
import { summarizeAgentInvocation } from "../lib/ai/utils/agent-telemetry";
import { createPublicImagesBucket } from "../lib/bucket";
import { repairPublicBucketImageLinks } from "../lib/content/review-utils";
import { writeContentDraft } from "../lib/content/write-content-draft";
import type { ArticleType } from "../lib/workspace/workflow.constant";
import type { InitialContext } from "../types";

function logInfo(message: string, data?: Record<string, unknown>) {
  console.info(`[SeoWriterWorkflow] ${message}`, data ?? {});
}

async function inferArticleType(args: {
  title?: string | null;
  primaryKeyword?: string | null;
  notes?: string | null;
  outline?: string | null;
}): Promise<ArticleType> {
  const { title, primaryKeyword, notes, outline } = args;
  if (!title && !primaryKeyword && !outline && !notes) {
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
    return heuristicMatch;
  }

  const result = await generateText({
    model: openai("gpt-5.2"),
    providerOptions: {
      openai: {
        reasoningEffort: "low",
      } satisfies OpenAIResponsesProviderOptions,
    },
    output: Output.object({
      schema: jsonSchema<{
        articleType: ArticleType;
      }>({
        type: "object",
        additionalProperties: false,
        required: ["articleType"],
        properties: {
          articleType: {
            type: "string",
            enum: [...ARTICLE_TYPES],
            description: "Chosen article type for the content",
          },
        },
      }),
    }),
    prompt: `Choose the best article type for this content and return JSON only.

<title>${titleText}</title>
<primary_keyword>${keywordText}</primary_keyword>
<notes>${notesText}</notes>
<outline>${outlineText}</outline>`,
  });

  return result.output.articleType;
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

  return { draft, project: projectResult.value };
}

type WriterInput = type.infer<typeof seoWriteArticleTaskInputSchema>;
export type SeoWriterWorkflowBinding = Workflow<WriterInput>;

export class SeoWriterWorkflow extends WorkflowEntrypoint<
  {
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

    const { draft, project, articleType, strategyContext } = await step.do(
      "load generation context",
      async () => {
        const db = createDb();
        const { draft, project } = await loadDraftAndProject({
          db,
          organizationId: input.organizationId,
          projectId: input.projectId,
          draftId: input.draftId,
        });

        const resolvedArticleType =
          draft.articleType ??
          (await inferArticleType({
            title: draft.title,
            primaryKeyword: draft.primaryKeyword,
            notes: draft.notes,
            outline: draft.outline,
          }));

        let strategyContext: StrategyContext | undefined;

        if (draft.strategyId) {
          const strategyResult = await getStrategyDetails({
            db,
            projectId: input.projectId,
            strategyId: draft.strategyId,
            organizationId: input.organizationId,
          });

          if (strategyResult.ok && strategyResult.value) {
            const strategy = strategyResult.value;

            // Find the phase that contains this draft to determine phase type
            const currentPhase = strategy.phases.find((phase) =>
              phase.phaseContents.some((pc) => pc.contentDraftId === draft.id),
            );

            // Collect sibling content from all phases
            const siblingContent = strategy.phases.flatMap((phase) =>
              phase.phaseContents.flatMap((pc) => {
                if (pc.contentDraftId === draft.id || pc.contentDraft == null) {
                  return [];
                }
                const d = pc.contentDraft;
                return [
                  {
                    title: d.title,
                    slug: d.slug,
                    role: d.role as "pillar" | "supporting" | null,
                    primaryKeyword: d.primaryKeyword,
                    status: d.status,
                  },
                ];
              }),
            );

            // Deduplicate siblings by draft id (a draft can appear in multiple phases)
            const seen = new Set<string>();
            const uniqueSiblings = siblingContent.filter((s) => {
              const key = s.slug;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            });

            strategyContext = {
              name: strategy.name,
              motivation: strategy.motivation,
              description: strategy.description,
              goal: strategy.goal as {
                metric: string;
                target: number;
                timeframe: string;
              },
              phaseType:
                (currentPhase?.type as
                  | "build"
                  | "optimize"
                  | "expand"
                  | null) ?? null,
              contentRole:
                (draft.role as "pillar" | "supporting" | null) ?? null,
              siblingContent: uniqueSiblings,
            };
          }
        }

        return {
          draft,
          project,
          articleType: resolvedArticleType,
          strategyContext,
        };
      },
    );

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
      if (!writeResult.ok) {
        throw writeResult.error;
      }
    });

    const taskPrompt = `Write the full article for this draft.

Context:
- Draft ID: ${draft.id}
- Title: ${draft.title ?? "(none)"}
- Primary keyword: ${draft.primaryKeyword ?? "(missing)"}
- Notes: ${draft.notes ?? "(none)"}
- Outline:
${draft.outline ?? "(missing)"}`;

    const createPipeline = () =>
      createWriterPipeline({
        db: createDb(),
        project,
        messages: [],
        cacheKV: this.env.CACHE,
        publicImagesBucket: createPublicImagesBucket(),
        mode: "workflow",
        articleType,
        primaryKeyword: draft.primaryKeyword ?? undefined,
        strategyContext,
      });

    const research = await step.do(
      "writer phase 1 research",
      { timeout: "3 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runResearchPhase({ task: taskPrompt });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "research",
          ...summarizeAgentInvocation(phase.steps),
        });
        return phase.output;
      },
    );

    const plan = await step.do(
      "writer phase 2 planning",
      { timeout: "2 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runPlanningPhase({
          task: taskPrompt,
          research,
        });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "planning",
          ...summarizeAgentInvocation(phase.steps),
        });
        return phase.output;
      },
    );

    const rawDraft = await step.do(
      "writer phase 3 writing",
      { timeout: "5 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runWritingPhase({
          task: taskPrompt,
          research,
          plan,
        });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "writing",
          ...summarizeAgentInvocation(phase.steps),
        });
        return phase.output;
      },
    );

    const internalLinkedDraft = await step.do(
      "writer phase 4 internal links",
      { timeout: "2 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runInternalLinksPhase({
          draft: rawDraft,
        });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "internal-links",
          ...summarizeAgentInvocation(phase.steps),
        });
        return phase.output;
      },
    );

    const imagedDraft = await step.do(
      "writer phase 5 images",
      { timeout: "3 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runImagesPhase({
          internalLinkedDraft,
        });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "images",
          ...summarizeAgentInvocation(phase.steps),
        });
        return phase.output;
      },
    );

    const reviewedArticle = await step.do(
      "writer phase 6 review",
      { timeout: "10 minutes" },
      async () => {
        const pipeline = createPipeline();
        const phase = await pipeline.runReviewLoopPhase({
          article: {
            markdown: imagedDraft.markdown,
            heroImage: imagedDraft.heroImage,
            heroImageCaption: imagedDraft.heroImageCaption,
          },
          maxReviewIterations: 3,
        });
        logInfo("writer phase completed", {
          instanceId: event.instanceId,
          draftId: input.draftId,
          phase: "review",
          ...summarizeAgentInvocation(phase.steps),
          reviewAttempts: phase.reviews.length,
          lastReviewPasses: phase.reviews.at(-1)?.passes ?? true,
          lastReviewScore: phase.reviews.at(-1)?.overallScore ?? null,
        });
        return phase.output;
      },
    );

    const repairedLinks = repairPublicBucketImageLinks({
      markdown: reviewedArticle.markdown.trim(),
      orgId: input.organizationId,
      projectId: input.projectId,
      kind: "content-image",
    });

    const articleMarkdown = repairedLinks.markdown;
    const heroImage = reviewedArticle.heroImage.trim();
    const heroImageCaption = reviewedArticle.heroImageCaption?.trim() || null;

    await step.do("save article draft", async () => {
      const db = createDb();
      const writeResult = await writeContentDraft({
        db,
        chatId: input.chatId ?? null,
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
      if (!writeResult.ok) {
        throw writeResult.error;
      }
    });

    logInfo("complete", {
      instanceId: event.instanceId,
      draftId: input.draftId,
      articleType,
      contentLength: articleMarkdown.length,
    });

    return {
      type: "seo-write-article",
      draftId: input.draftId,
      content: articleMarkdown,
      articleType,
      heroImage,
      heroImageCaption,
    } satisfies typeof seoWriteArticleTaskOutputSchema.infer;
  }
}
