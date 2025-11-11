import { anthropic } from "@ai-sdk/anthropic";
import { streamToEventIterator } from "@orpc/client";
import { ORPCError, type } from "@orpc/server";
import {
  convertToModelMessages,
  hasToolCall,
  stepCountIs,
  streamText,
  type UIMessage,
} from "ai";
import { withOrganizationIdBase } from "../context";
import { createDataforseoTool } from "../lib/ai-tools/dataforseo";
import { createGscTool } from "../lib/ai-tools/google-search-console";
import { getGSCPropertyById } from "../lib/database/gsc-property";
import { getProjectByIdentifier } from "../lib/database/project";
import { validateOrganizationMiddleware } from "../lib/validate-organization";

export const write = withOrganizationIdBase
  .route({ method: "POST", path: "/{id}/write" })
  .input(
    type<{
      organizationId: string;
      projectId: string;
      chatId: string;
      id: string;
      messages: UIMessage[];
    }>(),
  )
  .use(validateOrganizationMiddleware, (input) => input.organizationId)
  .handler(async ({ context, input }) => {
    const projectResult = await getProjectByIdentifier(
      input.projectId,
      context.organization.id,
    );
    if (!projectResult.ok) {
      throw new ORPCError("NOT_FOUND", { message: "Project not found" });
    }
    const project = projectResult.value;
    const gscProperty = await (async () => {
      if (!project.gscPropertyId) {
        return null;
      }
      const property = await getGSCPropertyById(project.gscPropertyId);
      if (!property.ok) {
        console.error(
          "Google Search Console property not found",
          property.error,
        );
        throw new ORPCError("NOT_FOUND", {
          message: `Google Search Console property not found: ${project.gscPropertyId}`,
        });
      }
      return property.value;
    })();

    const systemPrompt = `You are a senior AI SEO strategist and content operator for ${
      project.name ?? project.websiteUrl
    }.

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

Output requirements:
- Be concise but actionable; use bullet points and short sections.
- When more data is needed, ask clearly for what you need.
- Prefer specific, measurable recommendations with expected impact.
- If proposing edits to existing content, describe them clearly;
`;

    const result = streamText({
      model: anthropic("claude-haiku-4-5"),
      system: systemPrompt,
      messages: convertToModelMessages(input.messages),
      tools: {
        web_search: anthropic.tools.webSearch_20250305({ maxUses: 3 }),
        web_fetch: anthropic.tools.webFetch_20250910({ maxUses: 2 }),
        ...createGscTool({
          accessToken: gscProperty?.accessToken ?? null,
          siteUrl: gscProperty?.domain ?? null,
          siteType: gscProperty?.type ?? null,
        }),
        ...createDataforseoTool(project),
        // Minimal text edit tool stub to allow the model to propose edits without filesystem side-effects
        str_replace_based_edit_tool: anthropic.tools.textEditor_20250728({
          maxCharacters: 8000,
          async execute() {
            await Promise.resolve();
            return {
              type: "text",
              text: "Text editing is disabled in this environment. Provide proposed edits in plain text.",
            } as const;
          },
        }),
      },
      headers: {
        "anthropic-beta":
          "fine-grained-tool-streaming-2025-05-14,web-fetch-2025-09-10",
      },
      onStepFinish: (step) => {
        console.log("campaign.write step", step);
      },
      onFinish: (final) => {
        console.log("campaign.write result", final);
      },
      onError: (error) => {
        console.error("campaign.write error", error);
      },
      stopWhen: [stepCountIs(10), hasToolCall("manage_google_search_property")],
    });

    return streamToEventIterator(
      result.toUIMessageStream({
        sendSources: true,
        sendReasoning: true,
      }),
    );
  });
