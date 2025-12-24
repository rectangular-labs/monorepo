import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { ORPCError } from "@orpc/server";
import { fetchSerp } from "@rectangular-labs/dataforseo";
import { COUNTRY_CODE_MAP } from "@rectangular-labs/db/parsers";
import { catOutput } from "@rectangular-labs/loro-file-system";
import {
  generateText,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import { fetchPageContent } from "../../cloudflare/fetch-page-content";
import { getProjectInWebsocketChat } from "../../database/project";
import { configureDataForSeoClient } from "../../dataforseo/utils";
import { withLoroTree } from "../../workspace/with-loro-tree";
import { createFileToolsWithMetadata } from "./file-tool";
import { createImageToolWithMetadata } from "./image-tool";
import { createInternalLinksToolWithMetadata } from "./internal-links-tool";
import type { AgentToolDefinition } from "./utils";
import { createWebToolsWithMetadata } from "./web-tools";

const FunnelStepSchema = type("'top'|'middle'|'bottom'|'unknown'").describe(
  "Funnel step: top/middle/bottom/unknown",
);
const writingAgentInputSchema = type({
  keyword: type("string")
    .atLeastLength(1)
    .describe("Primary keyword to target."),
  countryCode: type("string")
    .atLeastLength(2)
    .describe("2-letter country code (e.g. US, GB, CA)."),
  languageCode: type("string")
    .atLeastLength(2)
    .describe("2-letter language code (e.g. en, es)."),
  funnelStep: FunnelStepSchema,
  articlePath: type("string").describe(
    "Path to the article file where the article will be written at.",
  ),
  instruction: type("string")
    .describe("High-level instruction of what is to be done.")
    .optional(),
  targetLengthWords: type("number")
    .describe("Approximate target length in words.")
    .optional(),
});
type WritingToolInput = typeof writingAgentInputSchema.infer;

// ============================================================================
// Types
// ============================================================================

type ReviewResult = {
  pass: boolean;
  reasons: string[];
  fixInstructions: string;
  brokenInternalLinks: string[];
  brokenExternalLinks: string[];
};

// ============================================================================
// Utility Functions
// ============================================================================

function slugify(input: string): string {
  const base = input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.length > 0 ? base : "article";
}

function extractHttpLinksFromMarkdown(markdown: string): string[] {
  const urls = new Set<string>();

  // Markdown links: [text](url)
  const mdLink = /\[[^\]]*\]\((https?:\/\/[^)\s]+)\)/gim;
  for (;;) {
    const m = mdLink.exec(markdown);
    if (!m) break;
    const u = m[1]?.trim();
    if (u) urls.add(u);
  }

  // Bare URLs
  const bare = /(https?:\/\/[^\s)<>\]]+)/gim;
  for (;;) {
    const m = bare.exec(markdown);
    if (!m) break;
    const u = m[1]?.trim();
    if (u) urls.add(u);
  }

  return Array.from(urls);
}

function parseFrontmatterKeysFromWritingSettings(writingSettings: {
  metadata?: { name: string; description: string }[] | null;
}): { key: string; description: string }[] {
  const defs = writingSettings.metadata ?? [];
  return defs
    .map((d) => ({
      key: d.name.trim(),
      description: d.description.trim(),
    }))
    .filter((d) => d.key.length > 0);
}

async function checkExternalLink(url: string): Promise<boolean> {
  try {
    const head = await fetch(url, { method: "HEAD" });
    if (head.ok) return true;
  } catch {
    // fall through
  }
  try {
    const res = await fetch(url, { method: "GET" });
    return res.ok;
  } catch {
    return false;
  }
}

function isInternalUrl(url: string, websiteUrl: string): boolean {
  try {
    const u = new URL(url);
    const site = new URL(websiteUrl);
    return (
      u.hostname.replace(/^www\./, "") === site.hostname.replace(/^www\./, "")
    );
  } catch {
    return false;
  }
}

function normalizeUrlForComparison(url: string): string {
  try {
    const u = new URL(url);
    u.hash = "";
    u.search = "";
    const isRoot = u.pathname === "/" || u.pathname === "";
    if (!isRoot) {
      u.pathname = u.pathname.replace(/\/+$/, "");
    }
    return u.toString();
  } catch {
    return url.trim().replace(/\/+$/, "");
  }
}

function buildFrontmatter(args: {
  keys: { key: string; description: string }[];
  values: Record<string, string>;
}): string {
  const lines: string[] = ["---"];
  for (const k of args.keys) {
    const v = args.values[k.key];
    if (v && v.trim().length > 0) {
      lines.push(`${k.key}: ${v.trim()}`);
    }
  }
  lines.push("---");
  return lines.join("\n");
}

function tryParseJsonObject<T extends object>(input: string): T | null {
  try {
    const parsed = JSON.parse(input);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return parsed as T;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================================================
// Data Fetching Functions
// ============================================================================

async function generateSeoGeoSlug(args: {
  keyword: string;
  funnelStep: WritingToolInput["funnelStep"];
  languageCode: string;
  countryCode: string;
}): Promise<string> {
  const { text } = await generateText({
    model: openai("gpt-4.1-mini"),
    system:
      "Generate a single SEO+GEO optimized URL slug. Return only the slug, no punctuation, no quotes. Use lowercase and hyphens.",
    messages: [
      {
        role: "user",
        content: [
          `Keyword: ${args.keyword}`,
          `Funnel step: ${args.funnelStep}`,
          `Language: ${args.languageCode}`,
          `Country: ${args.countryCode}`,
          "Requirements: concise, descriptive, avoid stop-words where possible, include the keyword (or tight variant) early.",
        ].join("\n"),
      },
    ],
  });
  return slugify(text);
}

async function fetchSerpData(args: {
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

  if (!serpResult.ok) {
    return {
      organic: [],
      aiOverview: null,
      peopleAlsoAsk: [],
      relatedSearches: [],
    };
  }

  const items = serpResult.value.searchResult;
  const organic: {
    url: string | null;
    title: string | null;
    description: string | null;
    extendedSnippet: string | null;
    markdownContent: string | null;
  }[] = [];
  let aiOverview: string | null = null;
  const peopleAlsoAsk: { question: string; answer: string | null }[] = [];
  const relatedSearches: string[] = [];

  for (const item of items ?? []) {
    switch (item.type) {
      case "organic": {
        organic.push({
          url: item.url,
          title: item.title,
          description: item.description,
          extendedSnippet: item.extendedSnippet,
          markdownContent: null,
        });
        break;
      }
      case "ai_overview": {
        if (aiOverview === null) {
          const textParts =
            item.items?.flatMap((i) => [i.title, i.text].filter(Boolean)) ?? [];
          const combined = textParts.join("\n").trim();
          aiOverview = combined.length > 0 ? combined : null;
        }
        break;
      }
      case "people_also_ask": {
        for (const paa of item.items ?? []) {
          peopleAlsoAsk.push({
            question: paa.question ?? "",
            answer:
              paa.answer ??
              (paa.table
                ? [
                    paa.table.headers.join("|"),
                    ...paa.table.rows.map((r) => r.join("|")),
                  ].join("\n")
                : ""),
          });
        }
        break;
      }
      case "related_searches": {
        for (const rs of item.items ?? []) {
          relatedSearches.push(rs);
        }
        break;
      }
    }
  }

  // Fetch competitor content from top URLs
  const fetched = await Promise.allSettled(
    organic.map(async ({ url }) => {
      if (!url) return { url, ok: false as const, markdown: "" };
      const r = await fetchPageContent({ url });
      if (!r.ok) {
        return { url, ok: false as const, markdown: "" };
      }
      return { url, ok: true as const, markdown: r.value.markdown };
    }),
  );

  for (let i = 0; i < fetched.length; ++i) {
    const fetchedItem = fetched[i];
    if (!fetchedItem) continue;
    if (fetchedItem.status === "fulfilled" && fetchedItem.value.ok) {
      const organicItem = organic[i];
      if (!organicItem) continue;
      organicItem.markdownContent = fetchedItem.value.markdown;
    }
  }

  return {
    aiOverview,
    peopleAlsoAsk,
    relatedSearches,
    organic,
  };
}

// ============================================================================
// Review Function
// ============================================================================
async function reviewArticle(args: {
  articleMarkdown: string;
  planMarkdown: string;
  websiteUrl: string;
  internalUrlSet: Set<string>;
}): Promise<ReviewResult> {
  const allLinks = extractHttpLinksFromMarkdown(args.articleMarkdown);
  const internalLinks = allLinks.filter((u) =>
    isInternalUrl(u, args.websiteUrl),
  );
  const externalLinks = allLinks.filter(
    (u) => !isInternalUrl(u, args.websiteUrl),
  );

  const brokenInternal = internalLinks.filter(
    (u) => !args.internalUrlSet.has(normalizeUrlForComparison(u)),
  );
  const externalChecks = await Promise.allSettled(
    externalLinks.slice(0, 10).map(async (u) => ({
      url: u,
      ok: await checkExternalLink(u),
    })),
  );
  const brokenExternal: string[] = [];
  for (const r of externalChecks) {
    if (r.status === "fulfilled" && !r.value.ok) {
      brokenExternal.push(r.value.url);
    }
  }

  const { text } = await generateText({
    model: openai("gpt-4.1"),
    system: [
      "You are a meticulous content reviewer. Evaluate the draft against the plan and SEO quality bar.",
      "Return STRICT JSON only with keys: pass(boolean), reasons(string[]), fixInstructions(string).",
      "Fail if: missing frontmatter, missing key sections, incoherent flow, doesn't satisfy intent/E-E-A-T, missing images, missing internal links.",
      "Also consider link issues that are provided.",
    ].join("\n"),
    messages: [
      {
        role: "user",
        content: JSON.stringify(
          {
            planMarkdown: args.planMarkdown,
            articleMarkdown: args.articleMarkdown,
            brokenInternalLinks: brokenInternal,
            brokenExternalLinks: brokenExternal,
          },
          null,
          2,
        ),
      },
    ],
  });

  const parsed = tryParseJsonObject<{
    pass: boolean;
    reasons: string[];
    fixInstructions: string;
  }>(text.trim());

  const pass =
    parsed?.pass === true &&
    brokenInternal.length === 0 &&
    brokenExternal.length === 0;

  return {
    pass,
    reasons: [
      ...(parsed?.reasons ?? [
        "Reviewer output was not valid JSON; treating as fail.",
      ]),
      ...(brokenInternal.length > 0
        ? [`Broken internal links: ${brokenInternal.join(", ")}`]
        : []),
      ...(brokenExternal.length > 0
        ? [`Broken external links: ${brokenExternal.join(", ")}`]
        : []),
    ],
    fixInstructions:
      parsed?.fixInstructions ??
      "Fix the issues and output a complete publish-ready markdown article.",
    brokenInternalLinks: brokenInternal,
    brokenExternalLinks: brokenExternal,
  };
}

// ============================================================================
// Main Writing Tool
// ============================================================================

export function createWritingTool() {
  const contentWriter = tool({
    description:
      "Plan, research, and write a comprehensive SEO/GEO-optimized article using an agentic workflow with deep research, image generation, and iterative review.",
    inputSchema: jsonSchema<typeof writingAgentInputSchema.infer>(
      writingAgentInputSchema.toJsonSchema() as JSONSchema7,
    ),
    execute: async (input: WritingToolInput) => {
      console.log("writing tool input: ", input);
      configureDataForSeoClient();
      const projectResult = await getProjectInWebsocketChat({
        includeAuthors: true,
      });
      if (!projectResult.ok || !projectResult.value) {
        throw new ORPCError("NOT_FOUND", {
          message: "Project not found in websocket context",
          cause: "error" in projectResult ? projectResult.error : undefined,
        });
      }

      const { writingSettings, authors, websiteUrl } = projectResult.value;

      const project = projectResult.value;
      const locationName =
        COUNTRY_CODE_MAP[input.countryCode] ?? "United States";
      const languageCode = input.languageCode;

      const serpData = await fetchSerpData({
        keyword: input.keyword,
        locationName,
        languageCode,
      });

      const existingArticle = await withLoroTree({
        handler: ({ tree }) =>
          catOutput({
            tree,
            path: input.articlePath,
            readContent: (node) => node.data.get("content")?.toString() ?? "",
          }),
        shouldPersist: false,
      });
      const hasExistingArticle =
        existingArticle.success && existingArticle.data.length > 0;

      const systemPrompt = `<role>
You are an elite SEO content strategist and writer specializing in creating high-performing, search-optimized content that ranks well in both traditional search and AI-powered search (GEO - Generative Engine Optimization).
</role>

<task>
${hasExistingArticle ? "Update" : "Create"} a comprehensive, publish-ready article for the keyword "${input.keyword}" that:
1. Outranks the current top 10 SERP results
2. Gets featured in AI Overviews and answer boxes
3. Drives organic traffic and conversions
4. Establishes E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness) for the site ${websiteUrl}.
</task>

<workflow>
<phase order="1" name="STRATEGIC PLANNING">
Before writing a single word, you MUST take the time to really understand the instruction. Create a comprehensive plan covering the following areas as needed:
- **Analyze the Competition**: Review the SERP results I've provided below. Identify:
   - What topics they cover thoroughly
   - Gaps in their coverage you can exploit
   - Their content structure and length
   - Unique angles you can take
   - Note that some articles might be outliers and you'll need to decide whether to include them in your plan.

   **Competitor Content Analysis**:
${
  serpData.organic.length > 0
    ? serpData.organic
        .map((item, index) => {
          const parts: string[] = [];
          parts.push(`\n   **Competitor ${index + 1}:**`);
          if (item.url) parts.push(`   URL: ${item.url}`);
          if (item.title) parts.push(`   Title: ${item.title}`);
          if (item.description)
            parts.push(`   Description: ${item.description}`);
          if (item.extendedSnippet)
            parts.push(`   Extended Snippet: ${item.extendedSnippet}`);
          if (item.markdownContent) {
            parts.push(`   **Full Content:**`);
            parts.push(`   \`\`\`markdown`);
            parts.push(`   ${item.markdownContent}`);
            parts.push(`   \`\`\``);
          }
          return parts.join("\n");
        })
        .join("\n")
    : "   (No competitor data available)"
}

${
  serpData.aiOverview
    ? `- **Address AI Overview**: Ensure that the content directly answers what it covers to be citation-worthy. 
    Current AI Overview: ${serpData.aiOverview}`
    : ""
}
${
  serpData.peopleAlsoAsk.length > 0
    ? `- **FAQ Strategy**: Rely on the "People Also Ask" questions to guide your FAQ content. Current PAA questions and answers:
  ${serpData.peopleAlsoAsk.map((p) => `    - ${p.question}: ${p.answer}`).join("\n")}`
    : ""
}
${
  serpData.relatedSearches.length > 0
    ? `- **Related Searches**: Incorporate these related searches naturally into the article content:
  ${serpData.relatedSearches.map((s) => `   - ${s}`).join("\n")}`
    : ""
}

- **use internal_links tool** to find:
   - Internal links to other articles that will be relevant to the article and will be useful for the reader.

- **Use web_search tool** to find:
   - Current statistics and data points
   - Case studies relevant to the topic
   - Primary sources for claims
   - Expert quotes or research papers

   Make sure that you let the web_search tool know to search thoroughly and deeply for the information you need.
</phase>

<phase order="2" name="CONTENT CREATION">
After planning is complete, write the full article based of the plan. Also refer to the following requirements:

1. **SEO + GEO Optimization**:
    - Use the keyword naturally in title, first paragraph, H2s, and throughout
    - Write clear, direct answers that AI can easily extract
    - Use structured formatting (lists, tables, callouts) for scannability
    - Include semantic variations and LSI keywords based on the related searches.
    ${input.funnelStep !== "unknown" ? `- Adjust depth and CTAs accordingly to be optimized for ${input.funnelStep} of the funnel stage.` : ""}

2. **Internal Links**: You SHOULD include at least 3-5 internal links in the article being written. 
    - If the plan doesn't include relevant internal links, use the internal_links tool to find more relevant internal links. 
    - The only time you can include less than 3 internal links is if the site is new or the particular topic is very narrow and we do not yet have enough articles to link to.

3. **External Links**: You MUST include at least 2-4 external links in the article being written to authoritative sources.
    - If the plan doesn't include relevant external links, use the web_search tool to find more relevant external links for:
        - Primary research/studies
        - Government/educational sites
        - Industry authority sites
        - NO affiliate links, NO competitor links. 

4. **Images**: Call generate_image for:
    - Hero image (required) - make sure to include the returned URL in your markdown with descriptive alt text
    - At least 1-2 in-article images (diagrams, illustrations, or concept visual). Again, make sure to include the returned URLs in your markdown with relevant and optimized descriptive alt text

5. **Product/Service Plugs**: If relevant, weave in mentions of ${websiteUrl}'s offerings naturally.

6. Brand Voice: ${writingSettings?.brandVoice || "Professional, authoritative, and helpful"}

7. Custom Instructions: ${writingSettings?.customInstructions || "None specified"}

8. Target Length: ${input.targetLengthWords ? `Approximately ${input.targetLengthWords} words` : "1000-1500 words (comprehensive but not bloated)"}

9. Frontmatter: The article MUST include these frontmatter fields:
${writingSettings?.metadata?.length ? writingSettings.metadata?.map((m) => `    - ${m.name}: ${m.description}`).join("\n") : "- (No custom frontmatter defined)"}

10. Save your work. Write the article to ${input.articlePath} in the workspace via the write_file tool.
</phase>
</workflow>

<reminders>
  - ALWAYS generate images and include their URLs
  - ALWAYS include internal links from the provided list
  - Write for humans first, but optimize for search engines and AI
  - Every claim should be backed by research or clearly marked as opinion
  - Make the content genuinely useful, not just SEO-stuffed
  - Save your work. Once completed, write the article to ${input.articlePath} in the workspace via the write_file tool.
</reminders>`;

      console.log(`[Writing Agent] Starting for keyword: ${input.keyword}`);
      const fileTools = createFileToolsWithMetadata();
      const webTools = createWebToolsWithMetadata();
      const imageTools = createImageToolWithMetadata();
      const internalLinksTools =
        createInternalLinksToolWithMetadata(websiteUrl);
      const { text } = await generateText({
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
            content: `Create a comprehensive, SEO/GEO-optimized article for the keyword "${input.keyword}". Follow the workflow exactly: plan first, then write. Use all available tools. ${input.instruction ? `Instruction: ${input.instruction}` : ""}`,
          },
        ],
        tools: {
          ...fileTools.tools,
          ...webTools.tools,
          ...internalLinksTools.tools,
          ...imageTools.tools,
        },
        stopWhen: [stepCountIs(50)],
        onStepFinish: (step) => {
          console.log(`[Writing Agent] Step completed:`, {
            text: step.text,
            toolResults: JSON.stringify(step.toolResults, null, 2),
          });
        },
      });

      console.log("generated text: ", text);
      // 9. Review loop (max 3 attempts)
      // let review: ReviewResult | null = null;
      // let finalArticleMarkdown = articleMarkdown;

      // for (let attempt = 1; attempt <= 3; attempt++) {
      //   review = await reviewArticle({
      //     articleMarkdown: finalArticleMarkdown,
      //     planMarkdown: planMarkdown ?? "",
      //     websiteUrl,
      //     internalUrlSet,
      //   });

      //   if (review.pass) {
      //     console.log(`[Writing Agent] Review passed on attempt ${attempt}`);
      //     break;
      //   }

      //   console.log(
      //     `[Writing Agent] Review failed on attempt ${attempt}:`,
      //     review.reasons,
      //   );

      //   if (attempt < 3) {
      //     // Ask the agent to fix issues
      //     const { text: revised } = await generateText({
      //       model: openai("gpt-4.1"),
      //       providerOptions: {
      //         openai: {
      //           reasoningEffort: "medium",
      //         } satisfies OpenAIResponsesProviderOptions,
      //       },
      //       system: [
      //         "You are revising a markdown article to fix reviewer issues.",
      //         'Return STRICT JSON only: {"frontmatter":{...},"body":"..."}.',
      //         "Body must be full article content, ready to publish.",
      //         "Fix all the issues identified by the reviewer.",
      //       ].join("\n"),
      //       messages: [
      //         {
      //           role: "user",
      //           content: JSON.stringify(
      //             {
      //               attempt,
      //               planMarkdown,
      //               currentArticleMarkdown: finalArticleMarkdown,
      //               review,
      //               internalUrls: internalUrls.slice(0, 50),
      //             },
      //             null,
      //             2,
      //           ),
      //         },
      //       ],
      //     });

      //     const parsed = tryParseJsonObject<{
      //       frontmatter: Record<string, string>;
      //       body: string;
      //     }>(revised.trim());
      //     if (parsed?.body) {
      //       const fmDefs =
      //         parseFrontmatterKeysFromWritingSettings(writingSettings);
      //       const fm = buildFrontmatter({
      //         keys: fmDefs,
      //         values: parsed.frontmatter ?? {},
      //       });
      //       finalArticleMarkdown = `${fm}\n\n${parsed.body.trim()}\n`;

      //       // Save revised article
      //       await writeWorkspaceFile({
      //         path: articlePath,
      //         content: finalArticleMarkdown,
      //         createIfMissing: true,
      //       });
      //     }
      //   }
      // }

      return {
        success: true,
        message: `Generated article and artifacts under ${input.articlePath} for keyword "${input.keyword}".`,
      };
    },
  });

  const tools = { content_writer: contentWriter } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "content_writer",
      toolDescription:
        "The content writer skill is used to plan, research, and write a comprehensive SEO/GEO-optimized article that supports research, image generation, and iterative review. Read the tool's instruction and use this skill whenever you are tasked with writing an article. You may skip planing ONLY for the article itself if it's clear that that an article is already planned to be written.",
      toolInstruction: [
        "Provide keyword, countryCode, languageCode, funnelStep, the articlePath for where to write the article in the workspace. Optionally provide instruction and targetLengthWords. The instruction should cover what we want to focus on, whether we are creating or editing the article, and when we want to publish the article alongside any specific authors we want to use etc.",
        "This tool runs an autonomous agent that:",
        "1. Analyzes top 10 SERP results, AI Overview, People Also Ask, and Related Searches",
        "2. Creates a comprehensive content plan with outline and research",
        "3. Writes a full SEO/GEO-optimized article with internal links, external citations, and generated images",
        "4. Reviews the article for quality and fixes issues automatically",
        "Outputs are written to the articlePath provided. Any existing article at the path will be overwritten.",
      ].join("\n"),
      tool: contentWriter,
    },
  ];

  return { toolDefinitions, tools };
}
