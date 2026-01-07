import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { catOutput } from "@rectangular-labs/loro-file-system";
import {
  generateObject,
  generateText,
  type JSONSchema7,
  jsonSchema,
  stepCountIs,
  tool,
} from "ai";
import { type } from "arktype";
import type { InitialContext, WebSocketContext } from "../../../types";
import { withLoroTree } from "../../workspace/with-loro-tree";
import { createFileToolsWithMetadata } from "./file-tool";
import { createImageToolsWithMetadata } from "./image-tools";
import { createInternalLinksToolWithMetadata } from "./internal-links-tool";
import type { AgentToolDefinition } from "./utils";
import { createWebToolsWithMetadata } from "./web-tools";

const FunnelStepSchema = type("'top'|'middle'|'bottom'|'unknown'").describe(
  "Funnel step: top/middle/bottom/unknown",
);

const writeContentInputSchema = type({
  funnelStep: FunnelStepSchema,
  planPath: type("string").describe(
    "Absolute workspace path to the research report / outline / brief the writer must follow. Example: '/plans/my-brief.md'.",
  ),
  articlePath: type("string").describe(
    "Absolute workspace path where the article should be written. Example: '/content/blog/my-post.mdx'.",
  ),
  instructions: type("string").describe(
    "Instructions for the article writer that is not covered by the plan.",
  ),
});

function readWorkspaceFile(
  path: string,
): Promise<{ ok: true; text: string } | { ok: false }> {
  return withLoroTree({
    handler: ({ tree }) => {
      const result = catOutput({
        tree,
        path,
        readContent: (node) => node.data.get("content")?.toString() ?? "",
      });
      if (!result.success) return { ok: false as const };
      return { ok: true as const, text: result.data };
    },
    shouldPersist: false,
  });
}

export function createArticleWritingToolWithMetadata({
  project,
  publicImagesBucket,
  cacheKV,
}: {
  project: NonNullable<WebSocketContext["cache"]["project"]>;
  publicImagesBucket: InitialContext["publicImagesBucket"];
  cacheKV: InitialContext["cacheKV"];
}) {
  const writeArticleContent = tool({
    description:
      "Write or update a comprehensive SEO/GEO-optimized article using a provided research report / outline. This tool focuses on writing and execution only (no strategic planning).",
    inputSchema: jsonSchema<{ instructions: string }>(
      type({
        instructions: "string",
      }).toJsonSchema() as JSONSchema7,
    ),
    execute: async (input) => {
      const { object: extracted } = await generateObject({
        model: openai("gpt-5.1-codex-mini"),
        providerOptions: {
          openai: {
            reasoningEffort: "medium",
          } satisfies OpenAIResponsesProviderOptions,
        },
        schema: jsonSchema<typeof writeContentInputSchema.infer>(
          writeContentInputSchema.toJsonSchema() as JSONSchema7,
        ),
        prompt: `Please analyze the instructions and extract the funnel step, plan path, article path, and any custom instructions that we should take note of. Instructions: ${input.instructions}`,
      });

      const { writingSettings, websiteUrl } = project;
      const existingArticle = await readWorkspaceFile(extracted.articlePath);
      const hasExistingArticle =
        existingArticle.ok && existingArticle.text.trim().length > 0;

      const systemPrompt = `<role>
You are an elite SEO content writer specializing in creating high-performing, search-optimized content that ranks well in both traditional search and AI-powered search (GEO - Generative Engine Optimization).
</role>

<task>
${hasExistingArticle ? "Update" : "Create"} a comprehensive, publish-ready article. Refer to ${extracted.planPath} for the plan which will include the target keyword, 2 letter target country code, 2 letter target language code, title/H2 outline, angle, Frequently Asked Questions, relevant text pointing to the sources to cite, internal link targets, target word count and any other instructions that should be followed.

The first thing you should do is to read the plan. Then execute the plan to perfection.
</task>

<hard-rule>
This tool is WRITE-ONLY. Do NOT create a strategic plan. Do NOT do competitor analysis. You MUST follow the provided plan and execute it into a final publish-ready article.
Instruction from the user OVERRIDES the plan.
</hard-rule>

<writing-requirements>
1. SEO + GEO:
   - Use the keyword naturally in title, first paragraph, and headings.
   - Write clear, direct answers that AI systems can extract.
   - Use structured formatting (lists/tables) for scannability.
   - Include semantic variations and LSI keywords based on the related searches.
   ${extracted.funnelStep !== "unknown" ? `- Optimize CTAs and depth for funnel step: ${extracted.funnelStep}.` : ""}
   - Maintain one consistent voice throughout; do not blend incompatible styles.
   - Write as an authoritative editor, not a conversational assistant. Avoid offers of help or implied interactivity.
   - Never emit meta labels like "Opinion:", "Caption:", "HeroImage:", or "CTA:".
   - Avoid "Introduction" as a section heading. Open with a strong lead paragraph, then use specific H2s.
   - Always end with a wrap-up section that summarizes what was covered; vary the heading instead of always using "Conclusion".
   - If a "Frequently Asked Questions" section is present, it must come after the wrap-up section and use the heading "Frequently Asked Questions".
   - Expand abbreviations on first use.
   - Keep Markdown clean: normal word spacing, no excessive blank lines, and straight quotes (").

2. Internal links:
   - Include 3-5 internal links when possible.
   - If the plan lacks internal links, use internal_links tool to find good candidates.
   - DO NOT have the link standalone by itself but rather use the markdown link syntax to wrap the link around relevant anchor text.
   - Make sure that the anchor text of the internal links is relevant to the content of the link. 
   <example>
   When thinking about [process automation](/path/to/process-automation-article), you should focus on final payoff instead of the initial setup.
   </example>

3. External links:
   - Include 2-4 authoritative external links.
   - If the plan doesn't include relevant external links, use the web_search tool to find more relevant external links for:
      - Primary research/studies
      - Government/educational sites
      - Industry authority sites
      - NO affiliate links, NO competitor links. 
   - No affiliate links; no competitor links.
   - Make sure that we don't have links itself on the same page but rather use the markdown link syntax to wrap the link around the anchor text of what's being quoted.
    <citation-example>
      According to the [Harvard Business Review](url_link), the most successful companies of the future will be those that can innovate fast.
    </citation-example>
    <citation-example>
      Up to [20% of companies](url_link) will be disrupted by AI in the next 5 years.
    </citation-example>

4. Images:
   - Make sure to have a hero image.
   - Add in-article images as required to keep the article engaging and enjoyable.
   - Use either the generate_image or capture_screenshot tool to produce images to use in the article. Note that if the images are not what we expect, please replace them either with the generate_image tool or capture_screenshot tool.
   - Use the included returned URLs from the generate_image or capture_screenshot tools in markdown with relevant and optimized descriptive alt text.
   - Place images immediately after the section title they belong to. Place the hero image immediately after the H1 title.

5. Brand voice: ${writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
6. Custom instructions: ${writingSettings?.customInstructions || "None specified"}
8. Frontmatter: Include these fields:
${writingSettings?.metadata?.length ? writingSettings.metadata.map((m) => `- ${m.name}: ${m.description}`).join("\n") : "- (No custom frontmatter defined)"}
9. Refer to the plan for the target word count.
10. Save. Write the full markdown article to ${extracted.articlePath} using write_file.
</writing-requirements>


<reminders>
  - ALWAYS generate images and include their URLs
  - Write for humans first, but optimize for search engines and AI
  - Every claim should be backed by research or clearly marked as opinion
  - Make the content genuinely useful, not just SEO-stuffed
  - Do not promise visuals or interactivity unless they are actually included
</reminders>`;

      const fileTools = createFileToolsWithMetadata({
        userId: undefined,
        publishingSettings: project.publishingSettings,
      });
      const webTools = createWebToolsWithMetadata(project, cacheKV);
      const imageTools = createImageToolsWithMetadata({
        organizationId: project.organizationId,
        projectId: project.id,
        imageSettings: project.imageSettings,
        publicImagesBucket,
      });
      const internalLinksTools =
        createInternalLinksToolWithMetadata(websiteUrl);

      await generateText({
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
            content: `Write the article now. Start by reading the plan at ${extracted.planPath} and understand the requirements. Some instructions to take note of: ${extracted.instructions}`,
          },
        ],
        tools: {
          ...fileTools.tools,
          ...webTools.tools,
          ...internalLinksTools.tools,
          ...imageTools.tools,
        },
        stopWhen: [stepCountIs(40)],
        onStepFinish: (step) => {
          console.log(`[write_article_content] Step completed:`, {
            text: step.text,
            toolResults: JSON.stringify(step.toolResults, null, 2),
            usage: step.usage,
          });
        },
      });

      return {
        success: true,
        message: `${hasExistingArticle ? "Updated" : "Created"} article at ${extracted.articlePath}.`,
      };
    },
  });

  const tools = { write_article_content: writeArticleContent } as const;
  const toolDefinitions: AgentToolDefinition[] = [
    {
      toolName: "write_article_content",
      toolDescription:
        "Write/update a publish-ready SEO/GEO article from a provided research report / outline. This skill is write-only. Make sure to use the research skill to create a plan first before using this skill.",
      toolInstruction: [
        "Provide funnelStep, planPath (e.g. '/plans/my-brief.md'), articlePath (where to write), and any custom instructions that we should take note of.",
        "This skill reads the plan from planPath and writes the final markdown article to articlePath via write_file, including images, internal links, and authoritative external citations.",
      ].join("\n"),
      tool: writeArticleContent,
      callDirect: true,
    },
  ];

  return { toolDefinitions, tools };
}
