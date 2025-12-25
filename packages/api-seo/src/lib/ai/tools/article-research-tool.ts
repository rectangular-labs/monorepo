import { google } from "@ai-sdk/google";
import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { fetchSerp } from "@rectangular-labs/dataforseo";
import { COUNTRY_CODE_MAP } from "@rectangular-labs/db/parsers";
import {
  generateObject,
  generateText,
  hasToolCall,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import type { WebSocketContext } from "../../../types";
import { fetchPageContent } from "../../cloudflare/fetch-page-content";
import { createDataforseoToolWithMetadata } from "./dataforseo-tool";
import { createFileToolsWithMetadata } from "./file-tool";
import { createInternalLinksToolWithMetadata } from "./internal-links-tool";
import { createPlannerToolsWithMetadata } from "./planner-tools";
import type { AgentToolDefinition } from "./utils";
import { createWebToolsWithMetadata } from "./web-tools";

const seoArticleResearchInputSchema = type({
  instructions: type("string")
    .atLeastLength(1)
    .describe(
      [
        "Instructions for SEO article research.",
        "You MUST include the output path in the form of /plans/{slug}.md (example: /plans/my-article.md).",
        "You should also include: primary keyword, target country (2-letter), target language (2-letter), and any constraints (audience, tone, product positioning, conversion goal, must-include points).",
      ].join(" "),
    ),
});

async function fetchSerpBundle(args: {
  keyword: string;
  locationName: string;
  languageCode: string;
}): Promise<{
  organic: {
    url: string | null;
    title: string | null;
    description: string | null;
    extendedSnippet: string | null;
    markdownContent: string | null;
    wordCount: number;
  }[];
  aiOverview: string | null;
  peopleAlsoAsk: { question: string; answer: string | null }[];
  relatedSearches: string[];
}> {
  const serpResult = await fetchSerp({
    keyword: args.keyword,
    locationName: args.locationName,
    languageCode: args.languageCode,
  });

  const items = serpResult.ok ? (serpResult.value.searchResult ?? []) : [];
  const organic: {
    url: string | null;
    title: string | null;
    description: string | null;
    extendedSnippet: string | null;
    markdownContent: string | null;
    wordCount: number;
  }[] = [];
  let aiOverview: string | null = null;
  const peopleAlsoAsk: { question: string; answer: string | null }[] = [];
  const relatedSearches: string[] = [];
  for (const item of items) {
    switch (item.type) {
      case "organic": {
        organic.push({
          url: item.url,
          title: item.title,
          description: item.description,
          extendedSnippet: item.extendedSnippet,
          markdownContent: null,
          wordCount: 0,
        });
        break;
      }
      case "ai_overview": {
        if (aiOverview === null) {
          const textParts =
            item.items?.flatMap((i) => {
              return [i.title, i.text].filter((item) => !!item);
            }) ?? [];
          const references =
            item.references?.map((r) => {
              return [`[${r.title}](${r.url})`];
            }) ?? [];
          const combined = [...textParts, ...["References:", ...references]]
            .join("\n")
            .trim();
          aiOverview = combined.length > 0 ? combined : null;
        }
        break;
      }
      case "people_also_ask": {
        for (const paa of item.items) {
          const question = paa.question ?? "";
          const answer = paa.answer;
          const tableAnswer =
            paa.table?.headers?.length && paa.table?.rows?.length
              ? [
                  paa.table.headers.join("|"),
                  ...paa.table.rows.map((r) => r.join("|")),
                ].join("\n")
              : null;

          peopleAlsoAsk.push({ question, answer: answer ?? tableAnswer });
        }
        break;
      }
      case "related_searches": {
        for (const rs of item.items) {
          relatedSearches.push(rs);
        }
        break;
      }
    }
  }

  // Fetch competitor content from top URLs (best-effort)
  const fetched = await Promise.allSettled(
    organic.map(async ({ url }) => {
      if (!url) return { url, ok: false as const };
      const r = await fetchPageContent({ url });
      if (!r.ok) return { url, ok: false as const };
      return {
        url,
        ok: true as const,
        markdown: r.value.markdown,
        wordCount: r.value.markdown.split(/\s+/).filter((word) => !!word)
          .length,
      };
    }),
  );

  for (let i = 0; i < fetched.length; ++i) {
    const fetchedItem = fetched[i];
    if (!fetchedItem) continue;
    if (fetchedItem.status === "fulfilled" && fetchedItem.value.ok) {
      const organicItem = organic[i];
      if (!organicItem) continue;
      organicItem.markdownContent = fetchedItem.value.markdown;
      organicItem.wordCount = fetchedItem.value.wordCount;
    }
  }

  return { organic, aiOverview, peopleAlsoAsk, relatedSearches };
}

export function createArticleResearchToolWithMetadata({
  project,
}: {
  project: NonNullable<WebSocketContext["cache"]["project"]>;
}) {
  const performArticleResearch = tool({
    description:
      "Research the best possible SEO article for a target keyword by analyzing the live SERP, competitor content, PAA/related searches/AI overview, and credible sources. Writes a writer-ready article plan + outline to /plans/{slug}.md.",
    inputSchema: jsonSchema<typeof seoArticleResearchInputSchema.infer>(
      seoArticleResearchInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async (input) => {
      const fileTools = createFileToolsWithMetadata();
      const webTools = createWebToolsWithMetadata();
      const dataforseoTools = createDataforseoToolWithMetadata(project);
      const internalLinksTools = createInternalLinksToolWithMetadata(
        project.websiteUrl,
      );
      const askQuestions = createPlannerToolsWithMetadata().tools.ask_questions;

      const { object: extracted } = await generateObject({
        model: google("gemini-3-flash-preview"),
        prompt: `Please analyze the instructions and extract the primary keyword, country code, language code from the following instructions: ${input.instructions}.`,
        schema: jsonSchema<{
          primaryKeyword: string;
          countryCode: string;
          languageCode: string;
        }>(
          type({
            primaryKeyword: type("string").describe(
              "The primary keyword that we are researching for.",
            ),
            countryCode: type("string").describe("The 2-letter country code."),
            languageCode: type("string").describe(
              "The 2-letter language code.",
            ),
          }).toJsonSchema() as JSONSchema7,
        ),
      });

      const locationName =
        COUNTRY_CODE_MAP[extracted.countryCode] ?? "United States";
      const serpData = await fetchSerpBundle({
        keyword: extracted.primaryKeyword,
        locationName,
        languageCode: extracted.languageCode,
      });
      console.log(
        "Word counts",
        serpData.organic.map((item) => item.wordCount),
      );

      const systemPrompt = `<role>
You are an expert SEO article researcher and strategist. Your job is to produce a writer-ready plan and outline for the BEST possible article for the target keyword. You MUST synthesize findings from the, competitor pages, and PAA/related searches/AI overview 

The goal is to create a plan that a writer can follow to:
1. Outranks the current top 10 SERP results
2. Gets featured in AI Overviews and answer boxes
3. Drives organic traffic and conversions
4. Establishes E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for the site ${project.websiteUrl}.
</role>

<critical-requirements>
- The final artifact MUST be a cohesive plan that a writer can follow end-to-end without guessing.
- The plan MUST include a concrete title and a H2/H3 outline with section-by-section notes (what to say, what to cite, and what unique angle to add).
- Prefer tool-grounded claims. When you cite stats or claims, link the source URL in the claim itself.
  <example>
  According to the [Harvard Business Review](url_link), the most successful companies of the future will be those that can innovate fast.
  </example>
  <example>
  Up to [20% of companies](url_link) will be disrupted by AI in the next 5 years.
  </example>
- Use internal_links to propose 5-10 highly relevant internal links to include (and suggested anchor text).
  <example>
  When thinking about [process automation](/path/to/process-automation-article), you should focus on final payoff instead of the initial setup.
  </example>
- Write the result to the provided plan path using write_file.
- Final response MUST be EXACTLY: "Research outline written to {location}"
</critical-requirements>

<workflow>
1) Analyze intent and SERP features (AI overview, PAA, related searches) for the keyword (provided in live-serp-data).
2) Analyze competitor pages: what they cover well, gaps, structure patterns, and differentiators (also provided in live-serp-data).
3) Gather sources: use web_search (and optionally web_fetch) for fresh stats, studies, definitions, and quotes.
4) Synthesize into a single best-possible plan + outline, with a POV section and asset plan (tables/diagrams). ONLY OUTPUT THIS SECTION IN THE PLAN FILE. DO NOT OUTPUT ANY OTHER SECTIONS.
    - The plan should follow closely the structure of competitor pages ${serpData.aiOverview ? "and the AI Overview" : ""} while also adding unique insights and angles. 
    - Add in a target word count to the plan so the writer knows how much to write.
    - Only suggest FAQ sections if the People Also Ask data is available. Use the People Also Ask data to guide the FAQ sections and limit 5 questions maximum. 
    - Use the related_searches to suggest semantic variations and LSI keywords to naturally insert in various sections.
5) Use write_file to save the plan to the location specified in the instructions.
</workflow>

<project context>
- Website: ${project.websiteUrl}
- Primary keyword: ${extracted.primaryKeyword}
- Target country: ${extracted.countryCode}
- Target language: ${extracted.languageCode}
</project context>


<live-serp-data>

- Competitor Organic Content in order of SERP ranking:
${
  serpData.organic.length > 0
    ? serpData.organic
        .map((item, index) => {
          const parts: string[] = [];
          parts.push(`\n**Competitor ${index + 1}:**`);
          if (item.url) parts.push(`URL: ${item.url}`);
          if (item.title) parts.push(`Title: ${item.title}`);
          if (item.description) parts.push(`Description: ${item.description}`);
          if (item.extendedSnippet)
            parts.push(`Extended Snippet: ${item.extendedSnippet}`);
          if (item.markdownContent) {
            parts.push(`**Full Content ${item.wordCount} words:**`);
            parts.push("```markdown");
            parts.push(item.markdownContent);
            parts.push("```");
          }
          return parts.join("\n");
        })
        .join("\n")
    : "(No competitor data available)"
}

${serpData.aiOverview ? `- AI Overview: ${serpData.aiOverview}` : "- (No AI Overview available)"}
${
  serpData.peopleAlsoAsk.length > 0
    ? [
        "- People Also Ask:",
        ...serpData.peopleAlsoAsk.map(
          (p) => `  - ${p.question}${p.answer ? `: ${p.answer}` : ""}`,
        ),
      ].join("\n")
    : "- (No People Also Ask available)"
}
${
  serpData.relatedSearches.length > 0
    ? [
        "- Related Searches:",
        ...serpData.relatedSearches.map((s) => `  - ${s}`),
      ].join("\n")
    : "- (No Related Searches available)"
}
</live-serp-data>`;

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
            content: `Primary keyword: ${extracted.primaryKeyword}
Country code: ${extracted.countryCode}
Language code: ${extracted.languageCode}

User instructions:
${input.instructions}`,
          },
        ],
        tools: {
          ...fileTools.tools,
          ...webTools.tools,
          ...internalLinksTools.tools,
          ...dataforseoTools.tools,
          ask_questions: askQuestions,
        },
        onStepFinish: (step) => {
          console.log(`[perform_article_research] Step completed:`, {
            text: step.text,
            toolResults: JSON.stringify(step.toolResults, null, 2),
            usage: step.usage,
          });
        },
        stopWhen: [stepCountIs(35), hasToolCall("ask_questions")],
      });

      const maybeAskArgs = toolCalls.some(
        (call) => call.toolName === "ask_questions",
      )
        ? toolCalls.find((call) => call.toolName === "ask_questions")?.input
        : null;
      if (maybeAskArgs) {
        return {
          success: false,
          needsClarification: true,
          ask_questions: maybeAskArgs,
          message:
            "SEO article research needs clarification. Please ask the user these questions and then re-run perform_article_research with the additional details.",
        };
      }

      return {
        success: true,
        message: text.trim(),
      };
    },
  });

  const tools = { perform_article_research: performArticleResearch } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "perform_article_research",
      toolDescription:
        "SEO article research: analyze live SERP + competitor content + PAA/related searches/AI overview + sources, then write a writer-ready plan + outline to /plans/{slug}.md. Returns a one-line status. Might return clarifying questions.",
      toolInstruction: [
        "Provide instructions including:",
        "- Primary keyword (e.g. `Primary keyword: best password manager`)",
        "- Country code (e.g. `Country code: US`)",
        "- Language code (e.g. `Language code: en`)",
        "- Output path (e.g. `/plans/best-password-manager.md`)",
        "Add any constraints (audience, ICP, tone, conversion goal, must-include points, must-cite sources, target word count etc.).",
        "If the tool returns needsClarification:true with ask_questions payload, ask the user or respond based on your current knowledge and then re-run perform_article_research with the SAME instructions, updated to include the answers.",
      ].join("\n"),
      callDirect: true,
      tool: performArticleResearch,
    },
  ];

  return { toolDefinitions, tools };
}
