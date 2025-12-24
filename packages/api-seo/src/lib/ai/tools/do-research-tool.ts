import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import type { WebSocketContext } from "../../../types";
import { stopWhenToolCalled } from "../stop-conditions";
import { createDataforseoToolWithMetadata } from "./dataforseo-tool";
import { createFileToolsWithMetadata } from "./file-tool";
import { createGscToolWithMetadata } from "./google-search-console-tool";
import { createInternalLinksToolWithMetadata } from "./internal-links-tool";
import { createPlannerToolsWithMetadata } from "./planner-tools";
import type { AgentToolDefinition } from "./utils";
import { createWebToolsWithMetadata } from "./web-tools";

const doResearchInputSchema = type({
  request: type("string")
    .atLeastLength(1)
    .describe(
      "What you want researched. Can be things like: plan a new article, audit/improve existing content around X, find opportunities regarding Y, analyze SERPs for Z, find keyword clusters around A, propose internal linking improvements for B, etc. Include any extra context the researcher should assume (constraints, audience, pages to focus on, etc.). YOU MUST include the place you want the report to be written too in the form of /plans/{slug}.md where slug is a place to put the report in the workspace.",
    ),
});
type DoResearchInput = typeof doResearchInputSchema.infer;

export function createDoResearchTool({
  project,
  gscProperty,
}: {
  project: NonNullable<WebSocketContext["cache"]["project"]>;
  gscProperty: WebSocketContext["cache"]["gscProperty"];
}) {
  const doResearch = tool({
    description:
      "Run deep SEO/GEO research to (a) plan new content, (b) improve existing content, and (c) identify opportunities. Writes a structured research report to /plans/{slug}.md. where slug is a place to put the report in the workspace.",
    inputSchema: jsonSchema<typeof doResearchInputSchema.infer>(
      doResearchInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async (input: DoResearchInput) => {
      const hasGsc = !!(
        gscProperty?.accessToken &&
        gscProperty?.domain &&
        gscProperty?.type
      );

      const fileTools = createFileToolsWithMetadata();
      const webTools = createWebToolsWithMetadata();
      const dataforseoTools = createDataforseoToolWithMetadata(project);
      const internalLinksTools = createInternalLinksToolWithMetadata(
        project.websiteUrl,
      );
      const gscTools = createGscToolWithMetadata({
        accessToken: gscProperty?.accessToken ?? null,
        siteUrl: gscProperty?.domain ?? null,
        siteType: gscProperty?.type ?? null,
      });
      const askQuestions = createPlannerToolsWithMetadata().tools.ask_questions;

      const systemPrompt = `<role>
You are an expert SEO/GEO researcher. Your job is to do deep, tool-grounded research and produce a structured report artifact for a human (and other agents) to use. The report should be written to /plans/{slug}.md where slug is a place to put the report in the workspace and will be provided by the user.
</role>

<capabilities>
- You can use Google Search Console (if connected) to analyze performance, CTR, decay, and query/page opportunities.
- You can use get_ranked_keywords_for_site, get_ranked_pages_for_site, get_keyword_suggestions, get_keywords_overview, or get_serp_for_keyword to get ranked pages/keywords for a site (including competitors), get keyword suggestions, keyword overviews, or inspect SERPs.
- You can use internal_links to find relevant internal pages to link to from a target topic.
- You can use web_search/web_fetch to do deep research and gather up-to-date facts and primary sources (link the text used in the report to the source URL as you go).
- You can use the virtual workspace filesystem tools (ls/cat/write_file) to read existing content and write artifacts.
</capabilities>

<workflow>
1) Clarify if needed: If key inputs are missing, call ask_questions with 1-6 crisp questions. Do not write a report until clarified.
2) Research: Use the available tools. Prefer combining tools to triangulate the truth.
3) Write report: Save a structured research report as Markdown to a location provided by the user.
4) Final response: Return ONLY a single line exactly: "Research report written to {location}"
</workflow>

<examples of tool collaboration>
- Content refresh/audit:
  - google_search_console_query -> find pages/queries with CTR below expected or decaying clicks/impressions
  - cat -> open the page/article content in the workspace
  - web_search/web_fetch -> find updated stats/sources to strengthen weak sections
  - internal_links -> propose 3-8 highly relevant internal links to add
  - write_file -> produce an action-oriented refresh plan + updated outline

- New content planning. The goal is to create content that outranks the current top 10 SERP results, get featured in AI Overviews and answer boxes, drive organic traffic and conversions, and establish E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for the site ${project.websiteUrl}. To do that:
  - get_serp_for_keyword -> Take the time to really understand the intent/SERP features + top competitors. Make sure that we use people also ask questions to guide our FAQ content. Incorporate related searches naturally into the article content.
  - web_search -> find current statistics and data points, case studies relevant to the topic, primary sources for claims, expert quotes or research papers. Make sure that you let the web_search tool know to search thoroughly and deeply for the information you need.
  - web_fetch -> pull ALL the competitors pages to analyze what they do well and what they don't do well. Specifically, we are trying to understand gaps in their coverage that we can exploit, their content structure and length, unique angles you can take, etc. Note that some articles might be outliers and you'll need to decide whether to include them in your plan.
  - get_keyword_suggestions + get_keywords_overview -> expand/priority subtopics and FAQs
  - internal_links -> identify internal pages to reference that are relevant to the topic and will be useful for the reader.
  - write_file -> produce a brief: target keyword,2  letter target country code, 2 letter target language code, title/H2 outline, angle, FAQs, relevant text pointing to the sources to cite, internal link targets, target word count. Make sure that you include a POV section (why your approach is better/unique), any optional instruction that should be noted, and plan any assets: diagrams, tables, hero images, etc.

- Opportunity research:
  - get_ranked_pages_for_site/get_ranked_keywords_for_site (competitors) -> find what they win on
  - google_search_console_query (your site) -> find where you underperform vs position
  - write_file -> produce a prioritized backlog with expected impact and next actions
</examples of tool collaboration>

<project context>
- Website: ${project.websiteUrl}
- Google Search Console: ${hasGsc ? "Connected" : "Not connected"}
</project context>`;

      const { text, toolCalls } = await generateText({
        model: openai("gpt-5.2"),
        providerOptions: {
          openai: {
            reasoningEffort: "medium",
          } satisfies OpenAIResponsesProviderOptions,
        },
        system: systemPrompt,
        messages: [
          {
            role: "user",
            content: `Request: ${input.request}`,
          },
        ],
        tools: {
          ...fileTools.tools,
          ...webTools.tools,
          ...internalLinksTools.tools,
          ...gscTools.tools,
          ...dataforseoTools.tools,
          ask_questions: askQuestions,
        },
        onStepFinish: (step) => {
          console.log(`[do_research] Step completed:`, {
            text: step.text,
            toolResults: JSON.stringify(step.toolResults, null, 2),
          });
        },
        stopWhen: [stepCountIs(30), stopWhenToolCalled("ask_questions")],
      });

      const maybeAskArgs =
        toolCalls.at(-1)?.toolName === "ask_questions"
          ? toolCalls.at(-1)?.input
          : null;
      if (maybeAskArgs) {
        return {
          success: false,
          needsClarification: true,
          ask_questions: maybeAskArgs,
          message:
            "Research needs clarification. Please ask the user these questions and then re-run do_research with the additional details.",
        };
      }

      return {
        success: true,
        message: text.trim(),
      };
    },
  });

  const tools = { do_research: doResearch } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "do_research",
      toolDescription:
        "Deep research skill for SEO/GEO: plan new content, audit/improve existing content, and identify opportunities. Writes a structured report to /plans/{slug}.md and returns a one-line status. Might return with request clarification.",
      toolInstruction: [
        "Provide a clear request. Optionally add notes (constraints, target pages, audience, etc.).",
        "Optional: outputSlug or outputPath to control where the report is written.",
        "If the tool returns needsClarification:true with ask_questions payload, ask the user (or infer from known context) and re-run do_research with the exact same instruction, updated with the request/notes that includes the answers.",
        "This skill can be used for a variety of SEO/GEO task that requires data reasoning: article planning, content refresh audits, opportunity discovery, keyword clustering, SERP analysis, internal linking recommendations, and performance-driven prioritization (when GSC is connected).",
      ].join("\n"),
      tool: doResearch,
    },
  ];

  return { toolDefinitions, tools };
}
