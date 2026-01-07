import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { schema } from "@rectangular-labs/db";
import { convertToModelMessages, type streamText } from "ai";
import type {
  InitialContext,
  SeoChatMessage,
  WebSocketContext,
} from "../../types";
import {
  ARTICLE_TYPE_TO_WRITER_RULE,
  type ArticleType,
  DEFAULT_BRAND_VOICE,
  DEFAULT_USER_INSTRUCTIONS,
} from "../workspace/workflow.constant";
import { formatBusinessBackground } from "./format-business-background";
import { createArticleResearchToolWithMetadata } from "./tools/article-research-tool";
import { createArticleWritingToolWithMetadata } from "./tools/article-writing-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createPlannerToolsWithMetadata } from "./tools/planner-tools";
import { createSkillTools } from "./tools/skill-tools";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "./tools/todo-tool";
import {
  type AgentToolDefinition,
  formatToolSkillsSection,
} from "./tools/utils";
import { createWebToolsWithMetadata } from "./tools/web-tools";

export type WriterPromptProjectContext = Pick<
  typeof schema.seoProject.$inferSelect,
  "websiteUrl" | "businessBackground" | "name" | "writingSettings"
>;

export function buildWriterSystemPrompt(args: {
  project: WriterPromptProjectContext;
  skillsSection: string;
  mode: "chat" | "workflow";
  articleType?: ArticleType;
  primaryKeyword?: string;
  outline?: string;
}): string {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const articleTypeRule = args.articleType
    ? ARTICLE_TYPE_TO_WRITER_RULE[args.articleType]
    : undefined;

  return `<role>
You are an elite SEO/GEO content writer and a strict editorial persona. You produce publish-ready, high quality Markdown articles with a consistent, authoritative voice.

You are methodical in your approach and use the \`manage_todo\` tool to track your work and keep the todo list current.

${
  args.mode === "chat"
    ? `
Your job is to help the user edit and finalize the article.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing about workspace state.`
    : `
Write a comprehensive Markdown article using the provided outline in outline tags below. It is important that you adhere to the outline provided as closely as possible.`
}
</role>
${
  args.mode === "chat"
    ? `<core-behavior>
1. If the user is editing an article, prioritize helping them improve the draft directly (structure, clarity, correctness, SEO, and citations).
4. Ask clarifying questions only when absolutely necessary.
5. Keep outputs concise and action-oriented.
</core-behavior>

<skills>
${args.skillsSection}
</skills>
`
    : ""
}
<writing-requirements>
- Follow the outline in outline tags closely; expand each section into helpful, grounded prose.
- Include 3-5 internal links (use internal_links if outline lacks them).
- Include 2-4 authoritative external links (use web_search if outline lacks them).
- Write as an authoritative editor, not a conversational assistant
- Never emit meta labels like "Opinion:", "Caption:", "HeroImage:", or "CTA:"
- Avoid "Introduction" as a section heading
- Always end with a wrap-up section that summarizes what was covered; vary the heading instead of always using "Conclusion"
- If a "Frequently Asked Questions" section is present, it must come after the wrap-up section and use the heading "Frequently Asked Questions"
- Keep Markdown clean: normal word spacing, no excessive blank lines, and straight quotes (")
- For images: 
  - Have one hero image which visually represents the topic of the search intent of the user. Objective of the hero image is to have a visual representation of the topic. Avoid images which are purely re-telling the details of the articles, and images that are too data/word heavy.
  - Outside of screenshots/stock photos/generated images required based on the article type rule, have at least one image for one of the H2 section in the article. Identify which section has the potential to have the best visual. Sections which describe a process, concept, or system are the best candidates for image generation.
  - Use the markdown syntax to embed the image in the article along with relevant descriptive alt text and caption (if applicable).
  - Place images immediately after the section title they belong to. Place the hero image immediately after the H1 title.
- For Bullet points:
  - Bold the heading of the bullet point, and use a colon after that before the explanation of the bullet point 
  - Always substantiate the bullet point by explaining what it means, what it entails, or how to use it.
- For Tables:
  - use tables when comparing (pricing, specs, rankings), as a summary for long listicle, and for any structured content that might have too many entries. 
  - Bold the headings for the tables (first row, and if applicable, first column)
- You must follow the brand voice and user instructions provided in the context section below.
- Output must be the FULL final Markdown article only (no commentary).
${articleTypeRule ? `- Article-type rule for ${args.articleType}: ${articleTypeRule}` : ""}
</writing-requirements>

<context>
- Today's date: ${utcDate} (UTC timezone)
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Article type: ${args.articleType ?? "other"}
- Primary keyword: ${args.primaryKeyword ?? "(missing)"}
- Project name: ${args.project.name ?? "(none)"}
</context>

<brand-voice>
${args.project.writingSettings?.brandVoice || DEFAULT_BRAND_VOICE}
</brand-voice>

<user-instructions>
${args.project.writingSettings?.customInstructions || DEFAULT_USER_INSTRUCTIONS}
</user-instructions>

<outline>
${args.outline ?? "(missing)"}
</outline>`;
}

export function createWriterAgent({
  messages,
  project,
  publicImagesBucket,
  cacheKV,
}: {
  messages: SeoChatMessage[];
  project: NonNullable<WebSocketContext["cache"]["project"]>;
  publicImagesBucket: InitialContext["publicImagesBucket"];
  cacheKV: InitialContext["cacheKV"];
}): Parameters<typeof streamText>[0] {
  const plannerTools = createPlannerToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata({ messages });

  const fileTools = createFileToolsWithMetadata({
    userId: undefined,
    publishingSettings: project.publishingSettings,
  });
  const webTools = createWebToolsWithMetadata(project, cacheKV);
  const researchTools = createArticleResearchToolWithMetadata({
    project,
    cacheKV,
  });
  const writingTools = createArticleWritingToolWithMetadata({
    project,
    publicImagesBucket,
    cacheKV,
  });

  const skillDefinitions: AgentToolDefinition[] = [
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...researchTools.toolDefinitions,
    ...writingTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = buildWriterSystemPrompt({
    project,
    skillsSection,
    mode: "chat",
  });

  return {
    model: openai("gpt-5.2"),
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
      } satisfies OpenAIResponsesProviderOptions,
    },
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      ...createSkillTools({ toolDefinitions: skillDefinitions }),
      ...plannerTools.tools,
      ...todoTools.tools,
    },
    prepareStep: ({ messages }) => {
      return {
        messages: [
          ...messages,
          {
            role: "system",
            content: formatTodoFocusReminder({
              todos: todoTools.getSnapshot(),
              maxOpen: 5,
            }),
          },
        ],
      };
    },
  } satisfies Parameters<typeof streamText>[0];
}
