import { anthropic } from "@ai-sdk/anthropic";
import type { schema } from "@rectangular-labs/db";
import {
  convertToModelMessages,
  type LanguageModel,
  type ModelMessage,
  type ToolSet,
  type UIMessage,
} from "ai";
import { createDataforseoTool } from "./dataforseo-tool";
import { createFileTools } from "./file-tool";
import { createGscTool } from "./google-search-console-tool";

export function createSeoAgent({
  messages,
  gscProperty,
  project,
}: {
  messages: UIMessage[];
  gscProperty:
    | (typeof schema.seoGscProperty.$inferSelect & {
        accessToken?: string | null;
      })
    | null;
  project: typeof schema.seoProject.$inferSelect;
}): {
  model: LanguageModel;
  system: string;
  messages: ModelMessage[];
  tools: ToolSet;
  headers: Record<string, string>;
} {
  const systemPrompt = `You are a senior AI SEO strategist and content operator for ${project.name ?? project.websiteUrl}.
  
Operating principles:
- Primary source: rely on google_search_console_query to analyze historical performance (queries, pages, CTR, impressions, clicks, positions) to learn what works, detect decay, and pinpoint weak CTR opportunities.
- Supplement with DataForSEO tools when needed:
  - get_ranked_keywords_for_site and get_ranked_pages_for_site to profile a site. Data on competitors sites should also be used when identifying content gaps.
  - get_keyword_suggestions and get_keywords_overview to build a keyword universe, cluster by intent, and prioritize topics.
  - get_serp_for_keyword to inspect live SERPs, ranking pages, and search intent for any keyword.
- You may also use web_search for up-to-date context and web_fetch to open specific sources; always cite URLs when using web data.
  
Project context:
- Website: ${project.websiteUrl}
- Website info: ${
    project.websiteInfo ? JSON.stringify(project.websiteInfo) : "(none)"
  }
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
- Navigating the Content Management System:
  - We have a content management system to manage all the content that we need to write and update.
  - We have tools such as ls, cat, rm, mv, write_file, etc. to read and write to the content management system.

Output requirements:
- Be concise but actionable; use bullet points and short sections.
- When more data is needed, ask clearly for what you need.
- Prefer specific, measurable recommendations with expected impact.
- If proposing edits to existing content, describe them clearly;`;

  return {
    model: anthropic("claude-sonnet-4-5"),
    system: systemPrompt,
    messages: convertToModelMessages(messages),
    tools: {
      web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
      web_fetch: anthropic.tools.webFetch_20250910({
        maxUses: 2,
        citations: {
          enabled: true,
        },
      }),
      ...createGscTool({
        accessToken: gscProperty?.accessToken ?? null,
        siteUrl: gscProperty?.domain ?? null,
        siteType: gscProperty?.type ?? null,
      }),
      ...createDataforseoTool(project),
      ...createFileTools(),
      // Minimal text edit tool stub to allow the model to propose edits without filesystem side-effects
      //   str_replace_based_edit_tool: anthropic.tools.textEditor_20250728({
      //     maxCharacters: 8000,
      //     async execute() {
      //       await Promise.resolve();
      //       return {
      //         type: "text",
      //         text: "Text editing is disabled in this environment. Provide proposed edits in plain text.",
      //       } as const;
      //     },
      //   }),
    },
    headers: {
      "anthropic-beta":
        "fine-grained-tool-streaming-2025-05-14,web-fetch-2025-09-10",
    },
  };
}
