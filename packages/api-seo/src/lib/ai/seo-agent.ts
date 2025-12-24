import { openai } from "@ai-sdk/openai";
import type { schema } from "@rectangular-labs/db";
import { convertToModelMessages, type streamText, type UIMessage } from "ai";
import { createDataAnalysisAgentTool } from "./tools/data-analysis-agent-tool";
import { createDataforseoToolWithMetadata } from "./tools/dataforseo-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createGscToolWithMetadata } from "./tools/google-search-console-tool";
import { createSettingsToolsWithMetadata } from "./tools/settings-tools";
import { createTodoTool } from "./tools/todo-tool";
import { createWebToolsWithMetadata } from "./tools/web-tools";
import { createWritingToolWithMetadata } from "./tools/writing-tool";

/**
 * We want to try both code/tool models.
 * For both,
 * * External system as memory
 * * Ability to spin up subagents for task
 * * Progressive disclosure of skills
 * * Reminders of tasks and skills.
 *
 * Tools needed:
 * * Read prior messages
 * * get message details
 * * run task
 * * manage to do
 * * research.
 *
 * Messages -> model -> prompt with note on its abilities
 * -> When done -> evaluator to decide whether done before finally returning back to the user.
 * @param param0
 * @returns
 */
export function createSeoAgent({
  messages,
  gscProperty,
  project,
}: {
  messages: UIMessage[];
  gscProperty:
    | (typeof schema.seoGscProperty.$inferSelect & {
        accessToken?: string;
      })
    | null;
  project: typeof schema.seoProject.$inferSelect;
}): Parameters<typeof streamText>[0] {
  const hasGsc = !!(
    gscProperty?.accessToken &&
    gscProperty?.domain &&
    gscProperty?.type
  );

  const systemPrompt = `You are a senior AI SEO strategist and content operator for ${project.name ?? project.websiteUrl}.
  
Operating principles:
- Primary source: ${hasGsc ? `rely on google_search_console_query to analyze historical performance (queries, pages, CTR, impressions, clicks, positions) to learn what works, detect decay, and pinpoint weak CTR opportunities.` : `NOTE: Google Search Console is not connected. You cannot analyze historical performance data for this site until a GSC property is connected. Use manage_google_search_property to help the user connect their account.`}
- Supplement with DataForSEO tools when needed:
  - get_ranked_keywords_for_site and get_ranked_pages_for_site to profile a site. Data on competitors sites should also be used when identifying content gaps.
  - get_keyword_suggestions and get_keywords_overview to build a keyword universe, cluster by intent, and prioritize topics.
  - get_serp_for_keyword to inspect live SERPs, ranking pages, and search intent for any keyword.
- You may also use web_search for up-to-date context and url_fetch to extract page content as Markdown from specific URLs; always cite URLs when using web data.
- Using the Content Management System:
  - We have a content management system to manage all the content that we need to write and update.
  - We have tools such as ls, cat, rm, mv, write_file, etc. to read and write to the content management system.
  - Whenever you're writing content, or asked to update existing content, make sure to use the content management system to write and update the content.
- Task Management:
  - Use manage_todo to create and update todos for the campaign. Todos are stored in /memories/task.md in the workspace.
  - Create todos for actionable items, track progress, and update status as tasks are completed.
- Data Analysis:
  - Use seo_data_analysis_agent for deep SEO data analysis. This specialized agent can analyze GSC performance, CTR opportunities, content decay, and keyword research.
  - ${hasGsc ? "The data analysis agent has access to Google Search Console data." : "The data analysis agent will guide you to connect Google Search Console first if needed."}

Project context:
- Website: ${project.websiteUrl}
- Website info: ${
    project.businessBackground
      ? JSON.stringify(project.businessBackground)
      : "(none)"
  }
${hasGsc ? `- Google Search Console: Connected (${gscProperty.domain})` : "- Google Search Console: Not connected - use manage_google_search_property to connect"}
- Ask concise clarifying questions or double check crucial data before proceeding.
  
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
- If proposing edits to existing content, describe them clearly;`;

  return {
    model: openai("gpt-5.2"),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      // Note: this agent is currently unused; keep it compiling by wiring to the
      // existing tool modules used by the planner agent.
      ...createSettingsToolsWithMetadata().tools,
      ...createFileToolsWithMetadata().tools,
      ...createWebToolsWithMetadata().tools,
      ...createGscToolWithMetadata({
        accessToken: gscProperty?.accessToken ?? null,
        siteUrl: gscProperty?.domain ?? null,
        siteType: gscProperty?.type ?? null,
      }).tools,
      ...createDataforseoToolWithMetadata(project).tools,
      ...createWritingToolWithMetadata({ project }).tools,
      ...createTodoTool(),
      ...createDataAnalysisAgentTool({ project, gscProperty }),
    },
    // headers: {
    //   "anthropic-beta":
    //     "fine-grained-tool-streaming-2025-05-14,web-fetch-2025-09-10",
    // },
  } satisfies Parameters<typeof streamText>[0];
}
