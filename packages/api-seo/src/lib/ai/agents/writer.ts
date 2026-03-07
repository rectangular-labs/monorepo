import type { OpenAIResponsesProviderOptions } from "@ai-sdk/openai";
import type { imageSettingsSchema } from "@rectangular-labs/core/schemas/project-parsers";
import type { DB, schema } from "@rectangular-labs/db";
import {
  generateText,
  jsonSchema,
  Output,
  type StepResult,
  stepCountIs,
  ToolLoopAgent,
  type ToolSet,
  type UIMessage,
} from "ai";
import type { createPublicImagesBucket } from "../../bucket";
import type { ArticleType } from "../../workspace/workflow.constant";
import { buildWriterInstructions } from "../instructions/writer";
import { createDataAccessTools } from "../tools/data-access-tool";
import { createDataforseoTool } from "../tools/dataforseo-tool";
import { createImageTools } from "../tools/image-tools";
import { createInternalLinksTool } from "../tools/internal-links-tool";
import { createWebTools } from "../tools/web-tools";
import {
  summarizeAgentInvocation,
  summarizeAgentStep,
} from "../utils/agent-telemetry";
import { type ReviewResult, reviewArticle } from "../utils/review";
import { wrappedOpenAI } from "../utils/wrapped-language-model";

export interface StrategyContext {
  name: string;
  motivation: string;
  description: string | null;
  goal: {
    metric: string;
    target: number;
    timeframe: string;
  };
  phaseType: "build" | "optimize" | "expand" | null;
  contentRole: "pillar" | "supporting" | null;
  siblingContent: {
    title: string | null;
    slug: string;
    role: "pillar" | "supporting" | null;
    primaryKeyword: string;
    status: string;
  }[];
}

interface WriterAgentContext {
  db: DB;
  project: typeof schema.seoProject.$inferSelect;
  messages: UIMessage[];
  cacheKV: KVNamespace;
  publicImagesBucket: ReturnType<typeof createPublicImagesBucket>;
  mode: "chat" | "workflow";
  articleType?: ArticleType;
  primaryKeyword?: string;
  strategyContext?: StrategyContext;
}

interface ContentPlan {
  intentStatement: string;
  targetWordCount: number;
  titleSuggestion: string;
  metaDescription: string;
  sectionPlan: {
    heading: string;
    goal: string;
    keyPoints: string[];
  }[];
  faqToInclude: string[];
}

interface RawDraft {
  markdown: string;
}

export interface LinkedDraft {
  markdown: string;
}

export interface ImagedDraft {
  markdown: string;
  heroImage: string;
  heroImageCaption: string | null;
}

export interface FinalArticle {
  markdown: string;
  heroImage: string;
  heroImageCaption: string | null;
}

type AnyStep = Awaited<ReturnType<typeof generateText>>["steps"][number];

export interface WriterPhaseResult<TOutput, TTools extends ToolSet = ToolSet> {
  output: TOutput;
  steps: StepResult<TTools>[];
}

export interface WriterPipelineArtifacts {
  research: ResearchSummary;
  plan: ContentPlan;
  rawDraft: RawDraft;
  internalLinkedDraft: LinkedDraft;
  imagedDraft: ImagedDraft;
  finalArticle: FinalArticle;
  reviews: ReviewResult[];
}

const openAIProviderOptions: OpenAIResponsesProviderOptions = {
  reasoningEffort: "medium",
};

function collectSteps(allSteps: unknown[], result: { steps?: unknown[] }) {
  if (!result.steps || result.steps.length === 0) {
    return;
  }
  allSteps.push(...result.steps);
}

function countWords(markdown: string): number {
  return markdown
    .replace(/[#*_`~[\]()>|!-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
}

interface ResearchSummary {
  primaryIntent: string;
  serpRepresentative: boolean;
  serpAssessment: string;
  competitorBreakdown: {
    title: string;
    url: string;
    topicsCovered: string[];
    strengths: string;
    gaps: string;
  }[];
  keyFindings: string[];
  faqCandidates: string[];
  sources: {
    title: string;
    url: string;
    relevance: string;
  }[];
}

export function createWriterPipeline(ctx: WriterAgentContext) {
  const researchTools = createWebTools(ctx.project, ctx.cacheKV);

  const imageTools = createImageTools({
    organizationId: ctx.project.organizationId,
    projectId: ctx.project.id,
    imageSettings:
      (ctx.project.imageSettings as typeof imageSettingsSchema.infer | null) ??
      null,
    publicImagesBucket: ctx.publicImagesBucket,
  });

  const dataforseoTools = createDataforseoTool(ctx.project, ctx.cacheKV);

  const internalLinksTools = createInternalLinksTool(ctx.project);

  const dataAccessTools = createDataAccessTools({
    db: ctx.db,
    organizationId: ctx.project.organizationId,
    projectId: ctx.project.id,
  });

  const staticSystemPrompt = buildWriterInstructions({
    project: ctx.project,
    mode: ctx.mode,
    articleType: ctx.articleType,
    primaryKeyword: ctx.primaryKeyword,
    strategyContext: ctx.strategyContext,
  });

  async function runResearchPhase(args: {
    task: string;
  }): Promise<
    WriterPhaseResult<
      ResearchSummary,
      typeof researchTools.tools &
        typeof dataAccessTools.tools &
        typeof dataforseoTools.tools
    >
  > {
    const researchAgent = new ToolLoopAgent({
      id: "writer-research",
      model: wrappedOpenAI("gpt-5.2"),
      instructions: staticSystemPrompt,
      tools: {
        ...researchTools.tools,
        ...dataAccessTools.tools,
        ...dataforseoTools.tools,
      },
      output: Output.object({
        schema: jsonSchema<ResearchSummary>({
          type: "object",
          additionalProperties: false,
          required: [
            "primaryIntent",
            "serpRepresentative",
            "serpAssessment",
            "competitorBreakdown",
            "keyFindings",
            "faqCandidates",
            "sources",
          ],
          properties: {
            primaryIntent: {
              type: "string",
              description:
                "The primary search intent behind the target keyword. Classify where it falls on the spectrum: informational, evaluation, or purchase-intent. Include a brief rationale (e.g. 'Informational — searchers want to understand what X is and how it works').",
            },
            serpRepresentative: {
              type: "boolean",
              description:
                "Whether the current SERP results are representative of the true search intent. False if the SERP is dominated by off-topic pages, spam, or content that clearly mismatches the intent (signals we should build from first principles rather than mimic existing results).",
            },
            serpAssessment: {
              type: "string",
              description:
                "A concise assessment of the current SERP landscape: dominant content formats (listicle, guide, comparison, landing page), approximate word count range of top results, notable SERP features (featured snippets, PAA, video carousels), and overall content quality. Keep this factual and brief — the planning phase will use it to make structural decisions.",
            },
            competitorBreakdown: {
              type: "array",
              description:
                "Structured analysis of the top 3-5 ranking pages. Each entry should be a page you actually fetched and read via web_fetch. Do NOT include pages you could not access. This should only cover the SERPS of the primary and secondary keywords that we are covering and not the other articles in the strategy.",
              items: {
                type: "object",
                additionalProperties: false,
                required: [
                  "title",
                  "url",
                  "topicsCovered",
                  "strengths",
                  "gaps",
                ],
                properties: {
                  title: {
                    type: "string",
                    description:
                      "The page's actual title as it appears on the page or in the SERP.",
                  },
                  url: {
                    type: "string",
                    description: "The exact URL of the competitor page.",
                  },
                  topicsCovered: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "List of distinct topics and subtopics the page covers. Be specific (e.g. 'pricing comparison table', 'step-by-step installation guide') not vague (e.g. 'introduction', 'details').",
                  },
                  strengths: {
                    type: "string",
                    description:
                      "What this page does well: depth of coverage, unique data, clear structure, original research, etc.",
                  },
                  gaps: {
                    type: "string",
                    description:
                      "What this page misses or does poorly: outdated information, shallow sections, missing subtopics, poor structure, no original data, etc.",
                  },
                },
              },
            },
            keyFindings: {
              type: "array",
              items: { type: "string" },
              description:
                "The 3-6 most important takeaways from the research that should directly inform article content. Focus on: (1) the information gain angle — what all competitors miss that we can uniquely provide, (2) critical facts, data points, or expert perspectives discovered, (3) content structure insights (what format/depth the intent demands). Each finding should be a concrete, actionable insight — not a vague observation.",
            },
            faqCandidates: {
              type: "array",
              items: { type: "string" },
              description:
                "Real People Also Ask questions and related queries observed in the SERP results. These MUST be actual questions you found in PAA boxes, related searches, or 'People also search for' sections — not questions you invented or inferred. Copy the exact wording from the SERP. If no PAA questions were present in the search results, return an empty array. Do NOT fabricate questions.",
            },
            sources: {
              type: "array",
              description:
                "Authoritative reference sources that can support claims in the article. These are NOT competitor pages (those go in competitorBreakdown) — these are citable authorities: research papers, industry reports, government/standards body publications, reputable news outlets, official documentation, or recognized expert publications. Each source must have been verified via web_fetch to confirm the URL is live and the content supports the stated relevance. Target 3-6 sources.",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["title", "url", "relevance"],
                properties: {
                  title: {
                    type: "string",
                    description:
                      "The title of the source page or publication as it actually appears.",
                  },
                  url: {
                    type: "string",
                    description:
                      "The exact, verified URL of the source. Must be a live page you confirmed via web_fetch. No placeholder or guessed URLs.",
                  },
                  relevance: {
                    type: "string",
                    description:
                      "A specific explanation of what claim or topic this source supports in the article (e.g. 'Provides the 2024 benchmark data on email open rates cited in the ROI section'). Do not use vague descriptions like 'relevant to the topic'.",
                  },
                },
              },
            },
          },
        }),
      }),
      stopWhen: stepCountIs(40),
      providerOptions: {
        openai: openAIProviderOptions,
      },
      onStepFinish: (step) => {
        console.log(
          "[writer:research] step finished",
          summarizeAgentStep(step),
        );
      },
    });

    const researchResult = await researchAgent.generate({
      prompt: `<phase id="1" name="research">
Research for this writing task:
${args.task}

Your goal is to build the evidence base the writer needs. Follow these steps IN ORDER:

## Step 0: SERP Lookup (MANDATORY FIRST STEP)
Call \`get_serp_for_keyword\` with the primary keyword${ctx.primaryKeyword ? ` ("${ctx.primaryKeyword}")` : ""} BEFORE doing anything else. The results contain structured SERP items with a \`type\` field. Extract from them:
- **Top organic results** (type: "organic"): The top 10 sites currently ranking. Use these as your reference list for competitor analysis — these are the pages you must read via \`web_fetch\` to understand what existing content covers.
- **People Also Ask (PAA) questions** (type: "people_also_ask"): The actual PAA questions Google surfaces for this keyword. These are the real questions searchers see — copy them verbatim into \`faqCandidates\`.
- **Related searches**: The related search queries Google shows at the bottom. Include these in \`faqCandidates\` alongside PAA questions (phrased as questions where appropriate).

This SERP data is your ground truth for understanding the search landscape.

## Step 1: Intent classification
Determine the primary search intent and where it falls on the intent spectrum (informational -> evaluation -> purchase-intent). This determines content length, structure, and tone.

## Step 2: SERP reality check
Using the SERP data from Step 0, evaluate whether current ranking pages are representative of the intent. Note the content formats that rank (listicle, comparison, guide, landing pages, etc.), approximate word counts, and SERP features present. If the SERP does not match the likely intent, note this — we will build from first principles instead.

## Step 3: Competitor breakdown (from SERP organic results)
For each of the top 5 ranking pages FROM THE SERP LOOKUP RESULTS, produce a structured breakdown:
   - What topics and subtopics does the page cover?
   - What are its strengths (depth, data, unique angles)?
   - What are its gaps or weaknesses (missing topics, shallow coverage, outdated info)?
   Use \`web_fetch\` to read each top result and extract this breakdown. This is critical — the planning phase will use this to build a section plan that covers everything the best pages cover, plus our information gain angle.

## Step 4: Information gain identification
Across all competitor pages, what do they ALL miss? Identify the unique angle or data this article can provide that none of the existing pages offer. This is the single most important quality signal.

## Step 5: Source candidates
Gather 3-6 authoritative REFERENCE sources — these are NOT competitor/SERP pages (those go in competitorBreakdown). Sources are citable authorities: research papers, industry reports, government/standards body publications, official documentation, reputable news outlets, or recognized expert publications. These sources will be embedded as inline citations during writing to back up specific claims. Use web_fetch to verify each source URL is live and the content matches your stated relevance. Every source must have a specific relevance statement explaining what claim it supports.

## Step 6: FAQ/PAA questions
Populate \`faqCandidates\` with the REAL People Also Ask questions and related searches from the get_serp_for_keyword results in Step 0. Copy the exact wording from the SERP data. Do NOT invent or infer questions — only include questions that appeared in the actual SERP PAA box (type: "people_also_ask") and related searches (type: "related_searches"). If the SERP returned no PAA questions or related searches, return an empty array.

Do not draft article prose. Output a structured research summary.
</phase>`,
    });

    return {
      output: researchResult.output,
      steps: researchResult.steps,
    };
  }

  async function runPlanningPhase(args: {
    task: string;
    research: ResearchSummary;
  }): Promise<WriterPhaseResult<ContentPlan, typeof researchTools.tools>> {
    const planningResult = await generateText({
      model: wrappedOpenAI("gpt-5.2"),
      system: staticSystemPrompt,
      providerOptions: {
        openai: openAIProviderOptions,
      },
      tools: {
        ...researchTools.tools,
      },
      prompt: `<phase id="2" name="planning">
Create a content plan from the research summary. The writer will receive BOTH this plan AND the full research summary, so do not restate research findings — focus on structural decisions and actionable planning.

Your role: translate raw research into a concrete writing blueprint. The research already covers intent, SERP analysis, competitor coverage, information gain, and sources. Your job is to decide HOW to structure the article, not to re-analyze WHAT exists.

Planning decisions:
1. **Intent statement**: One sentence capturing who this article is for and what it helps them do. This anchors all structural choices.
2. **Content type and length**: Based on the research's intent classification and SERP assessment, determine the right format and target word count. Bottom-of-funnel: 400-800 words. Evaluation: 800-1,500. Informational guides: 1,000-2,000. Match length to intent, not to an arbitrary default.
3. **Title**: SEO-optimized, includes the primary keyword naturally (toward the front when possible). Must be compelling enough to earn clicks. Max 60 characters.
4. **Meta description**: 150-160 characters, includes primary keyword, clear value proposition.
5. **Section plan**: This is the core deliverable. Build the section structure by:
   - Taking the UNION of all topics from the research competitorBreakdown (so we cover everything the best pages cover)
   - Adding at least one section that delivers the information gain angle from the research keyFindings
   - Ordering sections to match the reader's journey for this intent stage
   - Each section needs: a heading, its goal (what question it answers), and specific key points the writer must hit
   - Reference specific research findings or sources in the keyPoints where relevant (e.g. "Use the [source name] data to support X claim")
   - Every section must earn its place — cut sections that don't serve the primary intent, but don't cut topics that multiple competitors cover (that signals reader demand)
6. **FAQ selection**: Choose 3-5 real PAA questions from the research faqCandidates. Only include questions NOT already fully answered by the section plan's content. If the research returned no faqCandidates, return an empty array.

Task:
${args.task}

Research summary:
${JSON.stringify(args.research, null, 2)}
</phase>`,
      output: Output.object({
        schema: jsonSchema<ContentPlan>({
          type: "object",
          additionalProperties: false,
          required: [
            "intentStatement",
            "targetWordCount",
            "titleSuggestion",
            "metaDescription",
            "sectionPlan",
            "faqToInclude",
          ],
          properties: {
            intentStatement: {
              type: "string",
              description:
                "A one-sentence statement of the article's purpose and target reader (e.g. 'Help small business owners understand which invoice automation tool fits their workflow'). This anchors every structural decision in the plan.",
            },
            targetWordCount: {
              type: "number",
              description:
                "The target word count based on intent and SERP analysis. Bottom-of-funnel: 400-800. Evaluation: 800-1,500. Informational guides: 1,000-2,000. Do not default to a round number — justify based on what the intent demands.",
            },
            titleSuggestion: {
              type: "string",
              description:
                "SEO-optimized title that includes the primary keyword naturally (toward the front when possible). Must be compelling enough to earn clicks in the SERP. Max 60 characters for full display.",
            },
            metaDescription: {
              type: "string",
              description:
                "150-160 character meta description. Must include the primary keyword, state a clear value proposition, and compel the click. No fluff or generic language.",
            },
            sectionPlan: {
              type: "array",
              description:
                "Ordered list of article sections. Each section must earn its place — every section should directly serve the primary intent. The plan should cover the UNION of all topics from competitor pages plus the information gain angle. Do not include an 'Introduction' section — the opening is implicit.",
              items: {
                type: "object",
                additionalProperties: false,
                required: ["heading", "goal", "keyPoints"],
                properties: {
                  heading: {
                    type: "string",
                    description:
                      "The H2 heading for this section. Clear, direct, and descriptive. Avoid question-format headings unless the section genuinely answers a specific query.",
                  },
                  goal: {
                    type: "string",
                    description:
                      "What question this section answers for the reader or what decision it helps them make. This is an internal planning note — it won't appear in the article.",
                  },
                  keyPoints: {
                    type: "array",
                    items: { type: "string" },
                    description:
                      "The specific points the writer must cover in this section. Be concrete (e.g. 'Compare pricing tiers of top 3 tools') not vague (e.g. 'Discuss pricing'). Reference specific research findings or sources where relevant.",
                  },
                },
              },
            },
            faqToInclude: {
              type: "array",
              items: { type: "string" },
              description:
                "3-5 real PAA questions selected from the research faqCandidates that are relevant to the article and NOT already fully answered by the main section content. These will become the FAQ section at the end of the article. Use the exact question wording from the research. If the research returned no faqCandidates, return an empty array — do not invent questions.",
            },
          },
        }),
      }),
    });
    return {
      output: planningResult.output,
      steps: planningResult.steps,
    };
  }

  async function runWritingPhase(args: {
    task: string;
    research: ResearchSummary;
    plan: ContentPlan;
  }): Promise<WriterPhaseResult<RawDraft, typeof researchTools.tools>> {
    const writingAgent = new ToolLoopAgent({
      id: "writer-writing",
      model: wrappedOpenAI("gpt-5.2"),
      instructions: staticSystemPrompt,
      tools: {
        ...researchTools.tools,
      },
      output: Output.object({
        schema: jsonSchema<RawDraft>({
          type: "object",
          additionalProperties: false,
          required: ["markdown"],
          properties: {
            markdown: { type: "string" },
          },
        }),
      }),
      stopWhen: stepCountIs(40),
      providerOptions: {
        openai: openAIProviderOptions,
      },
      onStepFinish: (step) => {
        console.log("[writer:writing] step finished", summarizeAgentStep(step));
      },
    });

    const sourcesBlock =
      args.research.sources.length > 0
        ? `\nVerified sources from research (embed these as inline citations where they support claims):\n${args.research.sources.map((s) => `- [${s.title}](${s.url}) — ${s.relevance}`).join("\n")}\n`
        : "";

    const writingResult = await writingAgent.generate({
      prompt: `<phase id="3" name="writing">
Write the full article body in Markdown following the content plan.

Writing principles for this phase:
- Follow the content plan's section structure closely. Expand each section into grounded, helpful prose.
- Lead with the direct answer or key insight in the opening paragraph. LLMs and featured snippets extract from the first paragraph.
- Ensure the primary keyword appears in the opening sentence naturally.
- Write for the searcher's intent stage. Bottom-of-funnel: be decisive and concise. Informational: be thorough but efficient.
- Every section must deliver value. If a paragraph does not teach, persuade, or inform, cut it.
- Vary sentence structure. Mix short declarative sentences with longer explanatory ones.
- Deliver on the information gain identified in research — this is what differentiates this article from everything else on the SERP.

Citation requirements:
- Embed external links inline as you write. When you make a claim supported by a research source, link to it immediately using the source URL.
- Use the verified sources from research below as your primary citation pool. Embed them where they directly support claims.
- If you make a claim or cite a statistic that is not covered by the research sources, use web_search and web_fetch to find and verify an authoritative source before including it.
- Every statistic must have an inline citation. No uncited numbers.
- Embed links within the natural phrase they support (e.g., "a [McKinsey study](url) found that..."). Never add standalone "Source:" lines.
- When a sentence references a company/product/tool, anchor the brand name itself (e.g., "[Filestage](url) and [Ziflow](url) ..."), not awkward anchors like "[Filestage pricing](url)" unless you are explicitly discussing pricing pages.
- Never output placeholder anchor text patterns such as "(link to filestage)" or "(link to ziflow)".
- Do NOT invent, guess, or use placeholder URLs.
- Target 2-4 external citations minimum across the article.
${sourcesBlock}

Word count requirement:
- Target approximately ${args.plan.targetWordCount} words.
- Keep final draft length within ${Math.max(200, Math.floor(args.plan.targetWordCount * 0.85))}-${Math.ceil(args.plan.targetWordCount * 1.15)} words.
- If over the range, cut redundant content first. If under, add missing depth to key sections. Do not add filler.

Phase constraints:
- Do not include hero image metadata here.
- Do not add internal links yet (those come in a later phase).
- Do not add image embeds yet.

Task:
${args.task}

Content plan:
${JSON.stringify(args.plan, null, 2)}

Research summary:
${JSON.stringify(args.research, null, 2)}
</phase>`,
    });

    return {
      output: writingResult.output,
      steps: writingResult.steps,
    };
  }

  async function runInternalLinksPhase(args: {
    draft: RawDraft;
  }): Promise<WriterPhaseResult<LinkedDraft, typeof internalLinksTools.tools>> {
    const internalLinksAgent = new ToolLoopAgent({
      id: "writer-internal-links",
      model: wrappedOpenAI("gpt-5.2"),
      instructions: staticSystemPrompt,
      tools: {
        ...internalLinksTools.tools,
      },
      output: Output.object({
        schema: jsonSchema<LinkedDraft>({
          type: "object",
          additionalProperties: false,
          required: ["markdown"],
          properties: {
            markdown: { type: "string" },
          },
        }),
      }),
      stopWhen: stepCountIs(32),
      providerOptions: {
        openai: openAIProviderOptions,
      },
      onStepFinish: (step) => {
        console.log(
          "[writer:internal-links] step finished",
          summarizeAgentStep(step),
        );
      },
    });

    // Build cluster context block if strategy has sibling content
    const clusterSiblings = ctx.strategyContext?.siblingContent ?? [];
    const clusterBlock =
      clusterSiblings.length > 0
        ? `\nContent cluster (prioritize linking to these sibling pages):
${clusterSiblings
  .map((s) => {
    const roleLabel = s.role === "pillar" ? " [PILLAR]" : "";
    return `- "${s.title ?? s.primaryKeyword}" (/${s.slug})${roleLabel}`;
  })
  .join("\n")}

Cluster linking rules:
- Every article should link to the pillar page (marked [PILLAR]) at least once if one exists.
- Link to 2-3 sibling pages where contextually relevant.
- Use anchor text that includes the sibling's primary keyword naturally.
- Cluster links count toward the 5-10 internal links target. Supplement with additional site links found via the tool.\n`
        : "";

    const internalLinksResult = await internalLinksAgent.generate({
      prompt: `<phase id="5" name="internal-links">
Add 5-12 internal links to this draft using the internal_links tool.

Internal links build topical authority and guide readers toward conversion. They also influence how search engines and LLMs understand relationships between entities and pages on the site:
1. Use the internal_links tool to find relevant pages on the project's site.
2. Link from informational content toward money/conversion pages when contextually appropriate.
3. Use descriptive anchor text (2-5 words) that includes the target page's topic. Never use "click here", "here", "this", or "learn more".
4. CRITICAL: Copy URLs exactly as returned by the tool. Do NOT add, remove, or modify any characters.
5. Do not place links at the end of sentences in parentheses.
6. Distribute links naturally throughout the article. Do not cluster them all in one section.
7. Prioritize links to pages in the active strategy cluster first (pillar + sibling pages), then add other relevant internal links.
8. Place each internal link inside a semantically rich sentence that clearly explains the topic relationship between source and destination pages.
9. Use anchor text that reflects the destination's search intent/primary keyword naturally so relevance is explicit for users, search engines, and LLM retrieval.
${clusterBlock}
Return the full draft with internal links added. Do not change the content itself, only add links.

Draft:
${args.draft.markdown}
</phase>`,
    });
    return {
      output: internalLinksResult.output,
      steps: internalLinksResult.steps,
    };
  }

  async function runImagesPhase(args: {
    internalLinkedDraft: LinkedDraft;
  }): Promise<WriterPhaseResult<ImagedDraft, typeof imageTools.tools>> {
    const imagesAgent = new ToolLoopAgent({
      id: "writer-images",
      model: wrappedOpenAI("gpt-5.2"),
      instructions: staticSystemPrompt,
      tools: {
        ...imageTools.tools,
      },
      output: Output.object({
        schema: jsonSchema<ImagedDraft>({
          type: "object",
          additionalProperties: false,
          required: ["markdown", "heroImage", "heroImageCaption"],
          properties: {
            markdown: { type: "string" },
            heroImage: { type: "string" },
            heroImageCaption: {
              anyOf: [{ type: "string" }, { type: "null" }],
            },
          },
        }),
      }),
      stopWhen: stepCountIs(25),
      providerOptions: {
        openai: openAIProviderOptions,
      },
      onStepFinish: (step) => {
        console.log("[writer:images] step finished", summarizeAgentStep(step));
      },
    });

    const imagesResult = await imagesAgent.generate({
      prompt: `<phase id="6" name="images">
Add hero image metadata and place section images in the Markdown.

Images serve comprehension, not decoration:
1. **Hero image**: Select or generate an image that visually represents the article's topic. Set heroImage (URL) and heroImageCaption. Do NOT embed the hero image in the markdown body.
2. **Section images**: Identify which H2 sections have the best visual potential — processes, concepts, comparisons, step-by-step sequences, or product screenshots. Add at least one section image.
3. For article types that require images for every item (best-of lists, comparisons, listicles), ensure every listed item has an image.
4. If an image is meant to represent a specific brand/tool/product, use capture_screenshot on the brand's official site or product page first. Do not use generic stock photos or generate random images for brand-specific mentions.
5. Use find_stock_image only for generic concepts/scenes where no specific brand/entity should be shown.
6. Place images immediately after the section heading they belong to.
7. Use descriptive alt text that explains what the image actually shows.
8. NEVER inline base64 or data URIs. Only use URLs returned from image generation/stock photo tools.
9. Do NOT include image captions in the markdown unless they are stock photo attributions.
10. if you run into issues generating image, finding a stock image, or trying to screenshot a site, skip the image and continue with the rest of the article. Do not indicate in the markdown that an error was found or that an image was skipped. Do not attempt to generate an image in place of a failed tool call either.

Return the full draft with images added, plus heroImage and heroImageCaption fields.

Draft:
${args.internalLinkedDraft.markdown}
</phase>`,
    });
    return {
      output: imagesResult.output,
      steps: imagesResult.steps,
    };
  }

  async function runReviewLoopPhase(args: {
    article: FinalArticle;
    targetWordCount?: number;
    maxReviewIterations?: number;
  }): Promise<{
    output: FinalArticle;
    reviews: ReviewResult[];
    steps: AnyStep[];
  }> {
    const maxReviewIterations = args.maxReviewIterations ?? 3;
    const steps: AnyStep[] = [];
    const reviews: ReviewResult[] = [];
    let finalArticle = args.article;

    for (let attempt = 1; attempt <= maxReviewIterations; attempt += 1) {
      const review = await reviewArticle({
        article: finalArticle.markdown,
        primaryKeyword: ctx.primaryKeyword ?? "",
        websiteUrl: ctx.project.websiteUrl,
        brandVoice: ctx.project.writingSettings?.brandVoice ?? null,
        customInstructions:
          ctx.project.writingSettings?.customInstructions ?? null,
        targetWordCount: args.targetWordCount,
      });
      reviews.push(review);

      if (review.passes) {
        break;
      }

      const revisionAgent = new ToolLoopAgent({
        id: "writer-revision",
        model: wrappedOpenAI("gpt-5.2"),
        instructions: staticSystemPrompt,
        tools: {
          ...researchTools.tools,
          ...internalLinksTools.tools,
          ...imageTools.tools,
        },
        output: Output.object({
          schema: jsonSchema<ImagedDraft>({
            type: "object",
            additionalProperties: false,
            required: ["markdown", "heroImage", "heroImageCaption"],
            properties: {
              markdown: { type: "string" },
              heroImage: { type: "string" },
              heroImageCaption: {
                anyOf: [{ type: "string" }, { type: "null" }],
              },
            },
          }),
        }),
        stopWhen: stepCountIs(25),
        providerOptions: {
          openai: openAIProviderOptions,
        },
        onStepFinish: (step) => {
          console.log(
            "[writer:revision] step finished",
            summarizeAgentStep(step),
          );
        },
      });

      const revisionResult = await revisionAgent.generate({
        prompt: `<phase id="7" name="review-revise">
Revise the article based on review feedback. Return the full final artifact.

Revision principles:
- Address every specific revision item in the feedback. Do not skip any.
- Preserve what is working well. Do not rewrite sections that scored well unless the feedback explicitly requests changes.
- If the feedback identifies missing information gain, add unique insights or data — do not pad with generic filler.
- If the feedback identifies SEO issues (keyword placement, link quality), fix them precisely.
- If the feedback identifies readability issues, simplify sentence structure and improve flow.
- Use tools if needed: web_search/web_fetch for new sources, internal_links for additional internal links, image tools for missing images.
- Maintain the same JSON output format: markdown, heroImage, heroImageCaption.
- Hard requirement: keep the revised article length close to the target word count (${args.targetWordCount ?? "not provided"}). Current article length: ${countWords(finalArticle.markdown)} words.
- If currently above target range, remove redundant paragraphs, repetitive examples, and low-value tangents before rewriting.

Current article:
${JSON.stringify(finalArticle, null, 2)}

Review feedback:
${JSON.stringify(
  {
    overallScore: review.overallScore,
    feedback: review.feedback,
    revisions: review.revisions,
  },
  null,
  2,
)}
</phase>`,
      });
      collectSteps(steps, revisionResult);
      const revisedDraft = revisionResult.output;

      finalArticle = {
        markdown: revisedDraft.markdown,
        heroImage: revisedDraft.heroImage,
        heroImageCaption: revisedDraft.heroImageCaption,
      };
    }

    return {
      output: finalArticle,
      reviews,
      steps,
    };
  }

  async function run(args: {
    task: string;
    includeReviewLoop?: boolean;
    maxReviewIterations?: number;
  }) {
    const includeReviewLoop = args.includeReviewLoop ?? ctx.mode === "chat";
    const maxReviewIterations = args.maxReviewIterations ?? 3;
    const allSteps: AnyStep[] = [];

    const researchPhase = await runResearchPhase({
      task: args.task,
    });
    console.log("researchPhase.output", researchPhase.output);
    collectSteps(allSteps, researchPhase);

    const planningPhase = await runPlanningPhase({
      task: args.task,
      research: researchPhase.output,
    });
    console.log("planningPhase.output", planningPhase.output);
    collectSteps(allSteps, planningPhase);

    const writingPhase = await runWritingPhase({
      task: args.task,
      research: researchPhase.output,
      plan: planningPhase.output,
    });
    console.log("writingPhase.output", writingPhase.output);
    collectSteps(allSteps, writingPhase);

    const internalLinksPhase = await runInternalLinksPhase({
      draft: writingPhase.output,
    });
    console.log("internalLinksPhase.output", internalLinksPhase.output);
    collectSteps(allSteps, internalLinksPhase);

    const imagesPhase = await runImagesPhase({
      internalLinkedDraft: internalLinksPhase.output,
    });
    console.log("imagesPhase.output", imagesPhase.output);
    collectSteps(allSteps, imagesPhase);

    let finalArticle: FinalArticle = {
      markdown: imagesPhase.output.markdown,
      heroImage: imagesPhase.output.heroImage,
      heroImageCaption: imagesPhase.output.heroImageCaption,
    };

    let reviews: ReviewResult[] = [];

    if (includeReviewLoop) {
      const reviewPhase = await runReviewLoopPhase({
        article: finalArticle,
        targetWordCount: planningPhase.output.targetWordCount,
        maxReviewIterations,
      });
      console.log("reviewPhase.output", reviewPhase.output);
      collectSteps(allSteps, reviewPhase);
      finalArticle = reviewPhase.output;
      reviews = reviewPhase.reviews;
    }

    return {
      artifacts: {
        research: researchPhase.output,
        plan: planningPhase.output,
        rawDraft: writingPhase.output,
        internalLinkedDraft: internalLinksPhase.output,
        imagedDraft: imagesPhase.output,
        finalArticle,
        reviews,
      } satisfies WriterPipelineArtifacts,
      steps: allSteps,
      telemetry: summarizeAgentInvocation(allSteps),
    };
  }

  return {
    run,
    runResearchPhase,
    runPlanningPhase,
    runWritingPhase,
    runInternalLinksPhase,
    runImagesPhase,
    runReviewLoopPhase,
    workspaceTools: dataAccessTools,
  };
}

export function createWriterAgent(ctx: WriterAgentContext) {
  const pipeline = createWriterPipeline(ctx);

  const agent = {
    async generate(input: { prompt: string }) {
      const result = await pipeline.run({
        task: input.prompt,
        includeReviewLoop: ctx.mode === "chat",
      });

      return {
        text: JSON.stringify(result.artifacts.finalArticle, null, 2),
        steps: result.steps,
      };
    },
  };

  return {
    agent,
  };
}
