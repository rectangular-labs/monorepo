import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { ProjectChatCurrentPage } from "@rectangular-labs/core/schemas/project-chat-parsers";
import { convertToModelMessages, type streamText } from "ai";
import type { ChatContext, SeoChatMessage } from "../../types";
import { createCreateArticleToolWithMetadata } from "./tools/create-article-tool";
import { createDataforseoToolWithMetadata } from "./tools/dataforseo-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createGscToolWithMetadata } from "./tools/google-search-console-tool";
import { createPlannerToolsWithMetadata } from "./tools/planner-tools";
import { createSettingsToolsWithMetadata } from "./tools/settings-tools";
import { createSkillTools } from "./tools/skill-tools";
import { createStrategyToolsWithMetadata } from "./tools/strategy-tools";
import {
  createTodoToolWithMetadata,
  formatTodoFocusReminder,
} from "./tools/todo-tool";
import {
  type AgentToolDefinition,
  formatToolSkillsSection,
} from "./tools/utils";
import { createWebToolsWithMetadata } from "./tools/web-tools";
import { formatBusinessBackground } from "./utils/format-business-background";

function formatCurrentPageFocusReminder(
  currentPage: ProjectChatCurrentPage,
): string {
  const focus =
    currentPage === "stats"
      ? [
          "- Focus on interpreting the site's performance stats and diagnosing issues (rankings, CTR, decay, content gaps).",
          "- Prefer Google Search Console and SERP evidence when available.",
        ]
      : currentPage === "settings"
        ? [
            "- Focus on reviewing/updating project settings (writing voice, business background, images, integrations).",
            "- Ask only the minimum questions needed to make a safe settings change.",
          ]
        : currentPage === "content-planner" || currentPage === "content-list"
          ? [
              "- Focus on planning: keyword universe, clusters, prioritization, and concrete article suggestions.",
              "- When suggesting articles, keep slugs and internal links consistent with the project's website URL and any subfolder base path.",
            ]
          : [
              "- Focus on helping the user optimize the current article for SEO/GEO and rank for their target keyword.",
            ];

  return [
    '<system-reminder type="current page focus">',
    `User is currently on: ${currentPage}`,
    "",
    ...focus,
    "</system-reminder>",
  ].join("\n");
}

/**
What to deliver:
- Improving existing content:
  - Use google_search_console_query across time ranges to identify decaying pages/queries; propose specific refresh actions, target queries, and expected impact.
  - Find pages with weak CTR vs position; propose improved titles/meta, angle changes, and SERP feature optimizations (rich results, Frequently Asked Questions, etc.).
- Creating new content:
  - Build a data-driven keyword universe with get_keyword_suggestions and get_keywords_overview; group by intent and funnel stage; output a prioritized content plan with working titles, target queries, angle, format, and internal links.
  - Map the end-to-end user journey; recommend content to cover each step. Ask for missing journey details if needed.
  - Perform competitor analysis using get_ranked_keywords_for_site and get_ranked_pages_for_site on competitor hostnames to uncover opportunities and quick wins.
  - Create Q&A style content to answer common user questions; list Frequently Asked Questions and provide brief outlines.
- Highlighting opportunities:
  - Suggest guerrilla marketing and distribution tactics (e.g., targeted Reddit threads, X posts, community forums, PR/backlinks, features) with concrete next steps and candidate targets.
  - Recommend internal linking, schema, and technical quick wins where relevant.

Output requirements:
- Be concise but actionable; use bullet points and short sections.
- When more data is needed, ask clearly for what you need.
- Prefer specific, measurable recommendations with expected impact.
- If proposing edits to existing content, describe them clearly
 */

export async function createStrategistAgent({
  messages,
  gscProperty,
  project,
  context,
  currentPage,
}: {
  messages: SeoChatMessage[];
  gscProperty: ChatContext["cache"]["gscProperty"];
  project: NonNullable<ChatContext["cache"]["project"]>;
  context: ChatContext;
  currentPage: ProjectChatCurrentPage;
}): Promise<Parameters<typeof streamText>[0]> {
  const hasGsc = !!(
    gscProperty?.accessToken &&
    gscProperty?.config.domain &&
    gscProperty?.config.propertyType
  );

  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const plannerTools = createPlannerToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata({ messages });

  const settingsTools = createSettingsToolsWithMetadata({
    context: {
      db: context.db,
      projectId: project.id,
      organizationId: project.organizationId,
    },
  });
  const fileTools = createFileToolsWithMetadata({
    userId: context.userId,
    db: context.db,
    organizationId: project.organizationId,
    projectId: project.id,
    chatId: context.chatId,
  });
  const readOnlyFileToolDefinitions = fileTools.toolDefinitions.filter(
    (tool) => tool.toolName === "ls" || tool.toolName === "cat",
  );

  const webTools = createWebToolsWithMetadata(project, context.cacheKV);
  const gscTools = createGscToolWithMetadata({
    accessToken: gscProperty?.accessToken ?? null,
    siteUrl: gscProperty?.config.domain ?? null,
    siteType: gscProperty?.config.propertyType ?? null,
  });
  const dataforseoTools = createDataforseoToolWithMetadata(
    project,
    context.cacheKV,
  );
  const createArticleTool = createCreateArticleToolWithMetadata({
    userId: context.userId,
    project,
    context,
  });
  const strategyTools = createStrategyToolsWithMetadata({
    db: context.db,
    projectId: project.id,
    organizationId: project.organizationId,
  });

  const skillDefinitions: AgentToolDefinition[] = [
    ...settingsTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...gscTools.toolDefinitions,
    ...dataforseoTools.toolDefinitions,
    ...createArticleTool.toolDefinitions,
    ...strategyTools.toolDefinitions,
    ...readOnlyFileToolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = `<role>
You are an expert SEO/GEO strategist and planner.

Your job is to help the user create a coherent, prioritized content map with clear 
topical structure and ontology. You do this by helping the user understand their site's stats, manage project settings to optimize their site for SEO, and build a concrete content plan with high-quality article suggestions based on SERP, site, and keyword data.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing. You make sure to use the \`read_skills\` tool before using the \`use_skills\` tool to understand how to use the skill properly and take note of any specific instructions that the skill requires.

You ALWAYS make use of the \`manage_todo\` tool to track your work and keep the todo list current.

Ontology SEO constraint:
- When suggesting new articles, make sure that it is nested in appropriate ontological  subfolders in a way groups related topics together so that we can build relevant topical authority appropriately.
</role>

<core-behavior>
1. Understand: Restate the user's ask in 1-2 sentences; list assumptions that might change the answer.
2. Clarify: Ask targeted questions to clarify the intended behavior as needed before 
making any plans or executing any tasks. Dig deep and make sure you understand before beginning analysis. If things pop up mid way through analysis, STOP your analysis and clarify.
3. Diagnose: When discussing performance, focus on what the stats imply (position vs CTR vs impressions vs clicks), what's likely causing it, and what to test next.
4. Plan: Propose a prioritized plan (clusters, parent/child pages, intent mapping), then produce concrete article suggestions (primary keyword + slug). Use as many tools as required to come up with a clear scope of plan. You can formalize your plans at any time using the \`create_plan\` tool if it's big and you want to user to make sure it's correct before executing on it.
5. Execute: Use tools (GSC, SERP/keyword data, web) to ground recommendations. Link claims to source URLs when using web_search/web_fetch.
6. Track work: Use \`manage_todo\` tool to add tasks, mark tasks done, and keep the todo list current. Keep them atomic and execution-oriented. Make sure that the list reflects the current state of things at all times.
</core-behavior>

<skills>
${skillsSection}
</skills>

<project-context>
- Today's date: ${utcDate} (UTC timezone)
- Website: ${project.websiteUrl}${formatBusinessBackground(project.businessBackground)}
- Project name: ${project.name ?? "(none)"}
- Google Search Console: ${
    hasGsc ? `Connected (${gscProperty?.config.domain})` : "Not connected"
  }
- Guidance:
  - If GSC is not connected and the user asks for performance/decay/CTR, prioritize connecting via manage_integrations.
  - When using web_search/web_fetch, use claims as the anchor text to the source URLs.
</project-context>`;

  return {
    model: openai("gpt-5.2"),
    providerOptions: {
      openai: {
        reasoningEffort: "medium",
      } satisfies OpenAIResponsesProviderOptions,
    },
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
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
            content: formatCurrentPageFocusReminder(currentPage),
          },
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
