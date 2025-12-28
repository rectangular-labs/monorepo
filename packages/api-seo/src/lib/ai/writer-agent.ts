import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { convertToModelMessages, type streamText, type UIMessage } from "ai";
import type { WebSocketContext } from "../../types";
import { formatBusinessBackground } from "./format-business-background";
import { createArticleResearchToolWithMetadata } from "./tools/article-research-tool";
import { createArticleWritingToolWithMetadata } from "./tools/article-writing-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createMessagesToolsWithMetadata } from "./tools/message-tools";
import { createPlannerToolsWithMetadata } from "./tools/planner-tools";
import { createSkillTools } from "./tools/skill-tools";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
  getTodosSnapshot,
} from "./tools/todo-tool";
import {
  type AgentToolDefinition,
  formatToolSkillsSection,
} from "./tools/utils";
import { createWebToolsWithMetadata } from "./tools/web-tools";

export function createWriterAgent({
  messages,
  project,
}: {
  messages: UIMessage[];
  project: NonNullable<WebSocketContext["cache"]["project"]>;
}): Parameters<typeof streamText>[0] {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const plannerTools = createPlannerToolsWithMetadata();
  const messageTools = createMessagesToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata();

  const fileTools = createFileToolsWithMetadata();
  const webTools = createWebToolsWithMetadata();
  const researchTools = createArticleResearchToolWithMetadata({ project });
  const writingTools = createArticleWritingToolWithMetadata({ project });

  const skillDefinitions: AgentToolDefinition[] = [
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...researchTools.toolDefinitions,
    ...writingTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = `<role>
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
${skillsSection}
</skills>

<project-context>
- Today's date: ${utcDate} (UTC timezone)
- Website: ${project.websiteUrl}${formatBusinessBackground(project.businessBackground)}
- Project name: ${project.name ?? "(none)"}
- Writing voice: ${project.writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
</project-context>`;

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
      ...messageTools.tools,
      ...todoTools.tools,
    },
    prepareStep: async ({ messages }) => {
      const todos = await getTodosSnapshot();
      return {
        messages: [
          ...messages,
          {
            role: "system",
            content: formatTodoFocusReminder({
              todos,
              maxOpen: 5,
            }),
          },
        ],
      };
    },
  } satisfies Parameters<typeof streamText>[0];
}


