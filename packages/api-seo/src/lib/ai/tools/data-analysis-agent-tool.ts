import { openai } from "@ai-sdk/openai";
import { NO_SEARCH_CONSOLE_ERROR_MESSAGE } from "@rectangular-labs/core/schemas/gsc-property-parsers";
import type { GscConfig } from "@rectangular-labs/core/schemas/integration-parsers";
import type { schema } from "@rectangular-labs/db";
import { generateText, tool } from "ai";
import { type } from "arktype";
import type { InitialContext } from "../../../types";
import { createDataforseoToolWithMetadata } from "./dataforseo-tool";
import { createGscToolWithMetadata } from "./google-search-console-tool";
import type { AgentToolDefinition } from "./utils";

const dataAnalysisAgentInputSchema = type({
  question: "string",
});

export function createDataAnalysisAgentToolWithMetadata({
  project,
  gscProperty,
  cacheKV,
}: {
  project: typeof schema.seoProject.$inferSelect;
  gscProperty: {
    config: GscConfig;
    accessToken?: string | null;
  } | null;
  cacheKV: InitialContext["cacheKV"];
}) {
  const hasGsc = !!(
    gscProperty?.accessToken &&
    gscProperty?.config.domain &&
    gscProperty?.config.propertyType
  );

  const systemPrompt = `You are a specialized SEO data analysis agent. Your role is to analyze SEO performance data using Google Search Console and keyword research data source tools to provide actionable insights.

${
  hasGsc
    ? `## Google Search Console Available

You have access to Google Search Console data for ${gscProperty.config.domain}.

### Required Analysis Workflow:

1. **Historical Performance Comparison**:
   - Query GSC for the last ${28} days vs the previous ${28} days
   - Use dimensions: ["query", "page"] to identify trends
   - Look for: declining clicks, impressions, or positions (decay detection)
   - Identify pages/queries with weak CTR relative to position

2. **CTR Optimization Opportunities**:
   - Find pages ranking in positions 4-10 with CTR below expected benchmarks
   - Compare CTR by position to identify underperforming pages
   - Recommend title/meta description improvements

3. **Content Decay Detection**:
   - Compare current period vs previous period
   - Identify pages with significant drops in clicks/impressions
   - Flag potential cannibalization (multiple pages ranking for same queries)

4. **Supplement with keyword research data source tools**:
   - Use get_ranked_keywords_for_site to see what keywords the site ranks for
   - Use get_ranked_pages_for_site to see top-performing pages
   - Use get_keyword_suggestions to expand keyword universe
   - Use get_serp_for_keyword to analyze SERP competition

### Analysis Output Format:
- Summarize key findings with specific metrics
- Identify top 3-5 opportunities with expected impact
- Provide concrete next steps for each opportunity`
    : `## Google Search Console NOT Connected

**CRITICAL**: The project does not have a Google Search Console property connected. 

**You CANNOT perform historical performance analysis, CTR analysis, or decay detection without GSC data.**

### What You Should Do:
1. **Immediately inform the user** that GSC connection is required for site performance analysis
2. **Call the manage_google_search_property tool** to initiate the connection process
3. **Do NOT attempt** to analyze the user's site performance using only keyword research data source tools
4. You can still:
   - Perform competitor analysis using get_ranked_keywords_for_site and get_ranked_pages_for_site
   - Research keyword opportunities using get_keyword_suggestions
   - Analyze SERP competition using get_serp_for_keyword
   - But you MUST state clearly that site-specific performance analysis requires GSC connection

### Error Message to Reference:
${NO_SEARCH_CONSOLE_ERROR_MESSAGE}`
}

## Project Context:
- Website: ${project.websiteUrl}
- Business Background: ${
    project.businessBackground
      ? JSON.stringify(project.businessBackground)
      : "(none provided)"
  }

## Instructions:
- Answer the user's question using available tools
- Be data-driven and cite specific metrics
- If GSC is not connected, prioritize connecting it before attempting site analysis
- Provide actionable recommendations with expected impact`;

  const seoDataAnalysisAgent = tool({
    description:
      "Run SEO data analysis using Google Search Console and keyword research data source tools. This agent specializes in analyzing historical performance, CTR optimization, content decay, and keyword opportunities. If Google Search Console is not connected, it will guide you to connect it first.",
    inputSchema: dataAnalysisAgentInputSchema,
    async execute({ question }) {
      const result = await generateText({
        model: openai("gpt-5.1"),
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: question,
          },
        ],
        tools: {
          ...createGscToolWithMetadata({
            accessToken: gscProperty?.accessToken ?? null,
            siteUrl: gscProperty?.config.domain ?? null,
            siteType: gscProperty?.config.propertyType ?? null,
          }).tools,
          ...createDataforseoToolWithMetadata(project, cacheKV).tools,
          web_search: openai.tools.webSearch({
            externalWebAccess: true,
            searchContextSize: "medium",
            userLocation: {
              type: "approximate",
              city: "San Francisco",
              region: "California",
            },
          }),
        },
        onStepFinish: (step) => {
          console.log("data analysis agent step", step);
        },
      });

      return {
        analysis: result.text,
        toolCalls: result.toolCalls,
        toolResults: result.toolResults,
      };
    },
  });

  const tools = { seo_data_analysis_agent: seoDataAnalysisAgent } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "seo_data_analysis_agent",
      toolDescription:
        "Specialized sub-agent for SEO performance analysis (GSC + keyword research data source).",
      toolInstruction:
        "Provide a concrete question and desired timeframe. Use for deep analysis: CTR opportunities, content decay, query/page pivots, and prioritization. If GSC isn’t connected, it will guide connection first.",
      tool: seoDataAnalysisAgent,
    },
  ];

  return { toolDefinitions, tools };
}

export function createDataAnalysisAgentTool(args: {
  project: typeof schema.seoProject.$inferSelect;
  gscProperty: {
    config: GscConfig;
    accessToken?: string | null;
  } | null;
  cacheKV: InitialContext["cacheKV"];
}): ReturnType<typeof createDataAnalysisAgentToolWithMetadata>["tools"] {
  return createDataAnalysisAgentToolWithMetadata(args).tools;
}
