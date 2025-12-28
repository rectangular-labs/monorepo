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
} from "./tools/utils";
import { createWebToolsWithMetadata } from "./tools/web-tools";

/**
What to deliver:
- Improving existing content:
  - Use google_search_console_query across time ranges to identify decaying pages/queries; propose specific refresh actions, target queries, and expected impact.
  - Find pages with weak CTR vs position; propose improved titles/meta, angle changes, and SERP feature optimizations (rich results, FAQs, etc.).
- Creating new content:
  - Build a data-driven keyword universe with get_keyword_suggestions and get_keywords_overview; group by intent and funnel stage; output a prioritized content plan with working titles, target queries, angle, format, and internal links.
  - Map the end-to-end user journey; recommend content to cover each step. Ask for missing journey details if needed.
  - Perform competitor analysis using get_ranked_keywords_for_site and get_ranked_pages_for_site on competitor hostnames to uncover opportunities and quick wins.
  - Create Q&A style content to answer common user questions; list FAQs and provide brief outlines.
- Highlighting opportunities:
  - Suggest guerrilla marketing and distribution tactics (e.g., targeted Reddit threads, X posts, community forums, PR/backlinks, features) with concrete next steps and candidate targets.
  - Recommend internal linking, schema, and technical quick wins where relevant.

Output requirements:
- Be concise but actionable; use bullet points and short sections.
- When more data is needed, ask clearly for what you need.
- Prefer specific, measurable recommendations with expected impact.
- If proposing edits to existing content, describe them clearly
 */

export function createStrategistAgent({
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

  const skillDefinitions: AgentToolDefinition[] = [
    ...settingsTools.toolDefinitions,
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...gscTools.toolDefinitions,
    ...dataforseoTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = `<role>
You are an expert SEO/GEO strategist and planner.

Your job is to help the user create a coherent, prioritized content map with clear topical structure and ontology.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing.

IMPORTANT CONTEXT LIMITATION:
- You only receive a snippet of the user's latest message. Assume the last user message may be truncated/in response to a previous message.
- To recover full context, proactively use tools like \`get_historical_messages\` and \`get_message_detail\`, and ask clarifying questions when needed.
</role>

<core-behavior>
1. Understand: Dig into the user's ask and make sure to fully understand it. Restate the user's ask in 1-2 sentences; list assumptions.
2. Clarify: Ask targeted questions to clarify the intended behavior as needed before making any plans or executing any tasks.
3. Plan: propose a plan aligned to goals/constraints. Use clear topical clustering, parent/child relationships, and intent mapping.
4. Execute: Use tools to gather evidence (GSC, SERP data, web) and produce a concrete content plan.
5. Skill clarification loops: Some skills may return clarifying questions (e.g. seo_article_research may return needsClarification with an ask_questions payload). If that happens, "respond" to those questions by either asking the user (via ask_questions) or by using already-known facts. Then re-run the same skill with the SAME REQUEST again, adding the missing information.
6. Track work: Use \`manage_todo\` tool to add tasks, mark tasks done, and keep the todo list current.
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
  - If GSC is not connected and the user asks for performance/decay/CTR, prioritize connecting via manage_integrations.
  - When using web_search/web_fetch, link claims to source URLs.
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
