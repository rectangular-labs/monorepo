import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { convertToModelMessages, type streamText, type UIMessage } from "ai";
import type { WebSocketContext } from "../../types";
import { formatBusinessBackground } from "./format-business-background";
import { createDataforseoToolWithMetadata } from "./tools/dataforseo-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createGscToolWithMetadata } from "./tools/google-search-console-tool";
import { createMessagesToolsWithMetadata } from "./tools/message-tools";
import { createPlannerToolsWithMetadata } from "./tools/planner-tools";
import { createSettingsToolsWithMetadata } from "./tools/settings-tools";
import { createSkillTools } from "./tools/skill-tools";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
  getTodosSnapshot,
} from "./tools/todo-tool";
import {
  type AgentToolDefinition,
  formatToolSkillsSection,
} from "./tools/tool-definition";
import { createWebToolsWithMetadata } from "./tools/web-tools";
import { createWritingTool } from "./tools/writing-tool";

export function createPlannerAgent({
  messages,
  gscProperty,
  project,
}: {
  messages: UIMessage[];
  gscProperty: WebSocketContext["cache"]["gscProperty"];
  project: NonNullable<WebSocketContext["cache"]["project"]>;
}): Parameters<typeof streamText>[0] {
  const hasGsc = !!(
    gscProperty?.accessToken &&
    gscProperty?.domain &&
    gscProperty?.type
  );

  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const plannerTools = createPlannerToolsWithMetadata();
  const messageTools = createMessagesToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata();

  const settingsTools = createSettingsToolsWithMetadata();
  const fileTools = createFileToolsWithMetadata();
  const webTools = createWebToolsWithMetadata();
  const gscTools = createGscToolWithMetadata({
    accessToken: gscProperty?.accessToken ?? null,
    siteUrl: gscProperty?.domain ?? null,
    siteType: gscProperty?.type ?? null,
  });
  const dataforseoTools = createDataforseoToolWithMetadata(project);
  const writingTools = createWritingTool();

  const skillDefinitions: AgentToolDefinition[] = [
    ...settingsTools.toolDefinitions,
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...gscTools.toolDefinitions,
    ...dataforseoTools.toolDefinitions,
    ...writingTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = `<role>
You are an expert AI agent that helps users with Search Engine Optimization (SEO) and Generative Engine Optimization (GEO).

You have two power tools \`read_skills\` and \`use_skills\`. These are the go to tools that you should use to perform your job as an SEO/GEO strategist and operator. They allow you to improve existing content, write new content, and find opportunities to optimize the site.

IMPORTANT CONTEXT LIMITATION:
- You only receive a snippet of the user's latest message. Assume the last user message may be truncated/in response to a previous message.
- To recover full context, proactively use tools like \`get_historical_messages\` and \`get_message_detail\`, and ask clarifying questions when needed.
</role>

<core-behavior>
1. Understand: Dig into the user's ask and make sure to fully understand it. Restate the user's ask in 1-2 sentences; list assumptions.
2. Clarify: Ask targeted questions to clarify the intended behavior as needed before making any plans or executing any tasks.
3. Plan: propose a plan aligned to goals/constraints. ALWAYS create todos that are ordered by execution order to make sure that we can stay on track. For larger body of work, use \`create_plan\` to create a plan artifact and get the user's confirmation before proceeding. The only time we can side-step planning is if we are have a keyword that we want to write an article for. Use the \`content_writer\` skill to write the article in those cases. It'll handle the planning for the article.
4. Execute: Execute approved plans and to-dos step-by-step. Make sure that skills are used where relevant even if you already know the answer implicitly. Keep the user informed of progress by updating todos as tasks are completed or as new tasks are added.
5. Track work: Use \`manage_todo\` tool to add tasks, mark tasks done, and keep the todo list current.
</core-behavior>

<skills>
${skillsSection}
</skills>

<project-context>
- Today's date: ${utcDate} (UTC timezone)
- Website: ${project.websiteUrl}${formatBusinessBackground(project.businessBackground)}
- Project name: ${project.name ?? "(none)"}
- Google Search Console: ${
    hasGsc ? `Connected (${gscProperty?.domain})` : "Not connected"
  }
- Guidance:
  - If GSC is not connected and the user asks for performance/decay/CTR, prioritize connecting via manage_integrations and/or manage_google_search_property.
  - When using web_search/web_fetch, cite source URLs inline near claims.
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
