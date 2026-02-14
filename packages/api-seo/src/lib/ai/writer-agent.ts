import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import type { schema } from "@rectangular-labs/db";
import { convertToModelMessages, type streamText } from "ai";
import type { ChatContext, SeoChatMessage } from "../../types";
import {
  ARTICLE_TYPE_TO_WRITER_RULE,
  type ArticleType,
} from "../workspace/workflow.constant";
import { createFileToolsWithMetadata } from "./tools/file-tool";
import { createInternalLinksToolWithMetadata } from "./tools/internal-links-tool";
import { createPlannerToolsWithMetadata } from "./tools/planner-tools";
import { createSkillTools } from "./tools/skill-tools";
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

export type WriterPromptProjectContext = Pick<
  typeof schema.seoProject.$inferSelect,
  "websiteUrl" | "businessBackground" | "name" | "writingSettings"
>;

export function buildWriterSystemPrompt(args: {
  project: WriterPromptProjectContext;
  skillsSection: string;
  mode: "chat" | "workflow";
  articleType?: ArticleType;
  primaryKeyword?: string;
  outline?: string;
}): string {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const articleTypeRule = args.articleType
    ? ARTICLE_TYPE_TO_WRITER_RULE[args.articleType]
    : undefined;

  return `<role>
You are an elite SEO/GEO content writer and a strict editorial persona. You produce publish-ready, high quality Markdown articles with a consistent, authoritative voice.

You are methodical in your approach and use the \`manage_todo\` tool to track your work and keep the todo list current.

${
  args.mode === "chat"
    ? `
Your job is to help the user edit and finalize the article.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing about workspace state.`
    : `
Write a comprehensive Markdown article using the provided outline in outline tags below. It is important that you adhere to the outline provided as closely as possible.`
}
</role>
${
  args.mode === "chat"
    ? `<core-behavior>
1. If the user is editing an article, prioritize helping them improve the draft directly (structure, clarity, correctness, SEO, and citations).
4. Ask clarifying questions only when absolutely necessary.
5. Keep outputs concise and action-oriented.
</core-behavior>

<skills>
${args.skillsSection}
</skills>
`
    : ""
}
<writing-requirements>
- Use the primary keyword naturally in the opening paragraph and key headings.
- Provide clear, direct answers that AI systems can extract.
- Use structured formatting (lists/tables) for scannability when helpful.
- Use semantic variations and LSI keywords where they fit naturally.
- Follow the outline in outline tags closely; expand each section into helpful, grounded prose.
- Include 2-4 authoritative external links (use web_search if outline lacks them).
- Write as an authoritative editor, not a conversational assistant
- Never emit meta labels like "Opinion:", "Caption:", "HeroImage:", or "CTA:"
- Avoid "Introduction" as a section heading
- Include a section at the end that summarizes what was covered; vary the heading instead of always using "Conclusion". For example, we can talk about wrapping up, summarizing what we covered, etc. (of course, conclusion could also be a good fit)
- If a "Frequently Asked Questions" section is present, it must come after the wrap-up section and use the heading "Frequently Asked Questions"
- Expand abbreviations on first use.
- Keep Markdown clean: normal word spacing, no excessive blank lines, and straight quotes (")
- NEVER use thematic breaks (---) or HTML line breaks (<br/> or <br>) anywhere in the article.
- Headings must be clear, direct, and concise. NEVER include parenthetical elaborations or explanations in headings (e.g., use "Model data and integrations" NOT "Model your data and integrations (so the thing stays true)").
- Opening paragraph rules:
  - Start with a hook that directly addresses the reader's problem or goal.
  - Avoid generic statements like "In today's world..." or "Many businesses...".
  - Get to the point within the first two sentences.
  - Naturally introduce the primary keyword without forcing it.
- For images:
  - Select a hero image that visually represents the topic; return it in the heroImage field and include heroImageCaption if needed.
  - Do not embed the hero image or its caption in the Markdown output.
  - Outside of screenshots/stock photos/generated images required based on the article type rule, have at least one image for one of the H2 section in the article. Identify which section has the potential to have the best visual. Sections which describe a process, concept, or system are the best candidates for image generation.
  - Use the markdown syntax to embed the image in the article along with relevant descriptive alt text (describe what the image shows, not just "1.00" or generic text).
  - Do NOT include image captions in the Markdown output unless they are stock photo attributions.
  - Place images immediately after the section title they belong to.
  - NEVER inline image data as base64 or data URIs. Always use proper URLs returned from image generation/stock photo tools.
- For Bullet points:
  - Bold the heading of the bullet point, and use a colon after that before the explanation of the bullet point 
  - Always substantiate the bullet point by explaining what it means, what it entails, or how to use it.
- For Tables:
  - use tables when comparing (pricing, specs, rankings), as a summary for long listicle, and for any structured content that might have too many entries. 
  - Bold the headings for the tables (first row, and if applicable, first column)
- External links rules
  - Add external links only when they directly support a specific claim or statistic. All external links must be validated (page exists, no 404, relevant to the claim) via web_fetch or are returned from web_search. DO NOT put link placeholders or un-validated links, and DO NOT invent or guess URLs. Embed links inline within the exact phrase or sentence they support. Do not add standalone “Source:” sentences.
  - Statistics rules (strict)
    - Use numbers only if the source explicitly states them as findings (research, report, benchmark).
    - Do not treat marketing or CTA language as evidence. (e.g. “See how X reduces effort by 80%” is not necessarily a verified statistic).
    - If a number cannot be verified exactly, remove the number and rewrite the claim qualitatively.
    - The statistic must match the source exactly — no rounding, no reinterpretation.
  - Source quality rules
    - Prefer research, standards bodies, reputable publications, or industry reports.
    - Vendor pages are acceptable only for definitions or explanations — not performance claims.
    - If the page does not clearly support the statement being made, do not use it.
  <example>
    Duplicate invoices typically represent a small but real portion of AP leakage, often cited as [well under 1% of annual spend](https://www.example.com/well+under+annual+spend).
  </example>
  <example>
    According to the [Harvard Business Review](https://www.example.com/link-here), the most successful companies of the future will be those that can innovate fast.
  </example>
  <example>
    Up to [20% of companies](https://www.example.com/link-here) will be disrupted by AI in the next 5 years.
  </example>
- Internal links rules
  - Use the internal_links tool or web_search to find relevant internal pages to link to.
  - Use 5-10 internal links throughout the article where they naturally fit.
  - CRITICAL: Copy URLs exactly as returned by tools. Do NOT add, remove, or modify any characters in the URL (no trailing punctuation, no possessive 's, no apostrophes).
  - Embed links on descriptive anchor text (2-5 words), not on generic phrases like "click here", "here", "this", or "learn more".
  - Do NOT place links at the very end of sentences in parentheses like "(this)" or "(here)".
  <example>
    Explore our [home renovation guide](/home-renovation) to understand the key benefits.
  </example>
  <example>
    Teams using [workflow templates](/templates/workflow-templates) save significant time on setup.
  </example>
  <bad-example>
    Learn more about automation (here)[/automation].
  </bad-example>
- You must follow the brand voice and user instructions provided in the context section below.
- Output must be JSON with the full final Markdown article (no title, no hero image, no hero image caption), plus heroImage and heroImageCaption (if any).
${articleTypeRule ? `- Article-type rule for ${args.articleType}: ${articleTypeRule}` : ""}
</writing-requirements>

<context>
- Today's date: ${utcDate} (UTC timezone)
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Article type: ${args.articleType ?? "other"}
- Primary keyword: ${args.primaryKeyword ?? "(missing)"}
- Project name: ${args.project.name ?? "(none)"}
</context>

<brand-voice>
${args.project.writingSettings?.brandVoice}
</brand-voice>

<user-instructions>
${args.project.writingSettings?.customInstructions}
</user-instructions>

<outline>
${args.outline ?? "(missing)"}
</outline>`;
}

export function createWriterAgent({
  messages,
  project,
  context,
}: {
  messages: SeoChatMessage[];
  project: NonNullable<ChatContext["cache"]["project"]>;
  context: ChatContext;
}): Parameters<typeof streamText>[0] {
  const plannerTools = createPlannerToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata({ messages });

  const fileTools = createFileToolsWithMetadata({
    userId: undefined,
    db: context.db,
    organizationId: context.organizationId,
    projectId: context.projectId,
    chatId: context.chatId,
  });
  const webTools = createWebToolsWithMetadata(project, context.cacheKV);
  const internalLinksTools = createInternalLinksToolWithMetadata(
    project.websiteUrl,
  );

  const skillDefinitions: AgentToolDefinition[] = [
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...internalLinksTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = buildWriterSystemPrompt({
    project,
    skillsSection,
    mode: "chat",
  });

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
      ...todoTools.tools,
    },
    prepareStep: ({ messages }) => {
      return {
        messages: [
          ...messages,
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
