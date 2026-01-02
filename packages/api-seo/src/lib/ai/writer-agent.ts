import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { convertToModelMessages, type streamText } from "ai";
import type {
  InitialContext,
  SeoChatMessage,
  WebSocketContext,
} from "../../types";
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

export type WriterPromptProjectContext = {
  websiteUrl: string;
  businessBackground?: Parameters<typeof formatBusinessBackground>[0];
  name?: string | null;
  writingSettings?: {
    brandVoice?: string | null;
    customInstructions?: string | null;
  } | null;
  imageSettings?: unknown | null;
  publishingSettings?: { requireContentReview?: boolean | null } | null;
};

export function buildWriterSystemPrompt(args: {
  project: WriterPromptProjectContext;
  utcDate: string;
  skillsSection: string;
  mode: "chat" | "workflow";
  primaryKeyword?: string;
  outline?: string;
}): string {
  if (args.mode === "workflow") {
    return `<role>
You are an elite SEO/GEO content writer. You produce publish-ready, high quality Markdown articles.
</role>

<task>
Write a comprehensive Markdown article using the provided outline. This is WRITE-ONLY execution: do not create a new plan, do not do extra research beyond tool-grounded links.
</task>

<inputs>
- Primary keyword: ${args.primaryKeyword ?? "(missing)"}
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Project name: ${args.project.name ?? "(none)"}
- Writing voice: ${args.project.writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
- Custom instructions: ${args.project.writingSettings?.customInstructions || "None specified"}
</inputs>

<outline>
${args.outline ?? "(missing)"}
</outline>

<requirements>
- Follow the outline closely; expand each section into helpful, grounded prose.
- Include 3-5 internal links (use internal_links if outline lacks them).
- Include 2-4 authoritative external links (use web_search if outline lacks them).
- Include a hero image near the top and at least 1 additional image; use generate_image or capture_screenshot and embed returned URLs with descriptive alt text.
- Output must be the FULL final Markdown article only (no commentary).
</requirements>

<meta>
- Today's date: ${args.utcDate} (UTC timezone)
</meta>`;
  }

  return `<role>
You are an expert AI writing assistant for SEO/GEO content production.

Your job is to help the user draft, edit, and finalize articles inside the project's workspace.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing about workspace state.
</role>

<core-behavior>
1. If the user is editing an article, prioritize helping them improve the draft directly (structure, clarity, correctness, SEO, and citations).
2. If the user needs a brief/outline, use \`perform_article_research\` to create a plan under /plans/... first.
3. If the user wants a full draft, use \`write_article_content\` and point it at the plan and article paths.
4. Ask clarifying questions only when absolutely necessary.
5. Keep outputs concise and action-oriented.
</core-behavior>

<skills>
${args.skillsSection}
</skills>

<project-context>
- Today's date: ${args.utcDate} (UTC timezone)
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Project name: ${args.project.name ?? "(none)"}
- Writing voice: ${args.project.writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
</project-context>`;
}

export function createWriterAgent({
  messages,
  project,
  publicImagesBucket,
}: {
  messages: SeoChatMessage[];
  project: NonNullable<WebSocketContext["cache"]["project"]>;
  publicImagesBucket: InitialContext["publicImagesBucket"];
}): Parameters<typeof streamText>[0] {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const plannerTools = createPlannerToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata({ messages });

  const fileTools = createFileToolsWithMetadata();
  const webTools = createWebToolsWithMetadata();
  const researchTools = createArticleResearchToolWithMetadata({ project });
  const writingTools = createArticleWritingToolWithMetadata({
    project,
    publicImagesBucket,
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
    utcDate,
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
