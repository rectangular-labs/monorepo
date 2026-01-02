import { type OpenAIResponsesProviderOptions, openai } from "@ai-sdk/openai";
import { convertToModelMessages, type streamText } from "ai";
import type {
  InitialContext,
  SeoChatMessage,
  WebSocketContext,
} from "../../types";
import { formatBusinessBackground } from "./format-business-background";
import { createArticleResearchToolWithMetadata } from "./tools/article-research-tool";
import { createArticleWritingToolWithMetadata } from "./tools/article-writing-tool";
import { createFileToolsWithMetadata } from "./tools/file-tool";
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

export type WriterPromptProjectContext = {
  websiteUrl: string;
  businessBackground?: Parameters<typeof formatBusinessBackground>[0];
  name?: string | null;
  writingSettings?: {
    brandVoice?: string | null;
    customInstructions?: string | null;
  } | null;
  imageSettings?: unknown | null;
  publishingSettings?: { requireContentReview?: boolean | null } | null;
};

export function buildWriterSystemPrompt(args: {
  project: WriterPromptProjectContext;
  utcDate: string;
  skillsSection: string;
  mode: "chat" | "workflow";
  primaryKeyword?: string;
  outline?: string;
}): string {
  if (args.mode === "workflow") {
    return `<role>
You are an elite SEO/GEO content writer. You produce publish-ready, high quality Markdown articles.
</role>

<task>
Write a comprehensive Markdown article using the provided outline. This is WRITE-ONLY execution: do not create a new plan, do not do extra research beyond tool-grounded links.
</task>

<inputs>
- Primary keyword: ${args.primaryKeyword ?? "(missing)"}
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Project name: ${args.project.name ?? "(none)"}
- Writing voice: ${args.project.writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
- Custom instructions: ${args.project.writingSettings?.customInstructions || "None specified"}
</inputs>

<outline>
${args.outline ?? "(missing)"}
</outline>


<requirements>
- Follow the outline closely; expand each section into helpful, grounded prose.
- Include 3-5 internal links (use internal_links if outline lacks them).
- Include 2-4 authoritative external links (use web_search if outline lacks them).
- Include a hero image near the top and at least 1 additional image; use generate_image or capture_screenshot and embed returned URLs with descriptive alt text.
- Output must be the FULL final Markdown article only (no commentary).

-  If any of these specific article types are written, follow these instructions. These instructions should override any contradicting instructions found elsewhere. If the type of article being written is not listed here, ignore this list.

## Best of lists
1. Word light - Explain why each item is listed succinctly - don't over-explain. Each section should be a maximum of 50 words
2. Always include links to each of the listed items/services 
3. Give an opinion as to why the top listed product is considered the best and why


## Comparisons (comparing two or more products or services or items)
1. Include external links to the product/item being compared to
2. Must clearly take a stance on which product is better for what purposes and why - opinion must be given by the end


## How to (guide)
1. Tone should be instructional and confident
2. Opinions can be given but should be clearly labelled as opinions


## Listicle (generically)
1. Always include an external link to each item on the list
2. Word light - Explain why each item is listed succinctly - don't over-explain. Each section should be a maximum of 50 words.

## Long form - opinions
1. Signpost well
2. Write in a stream-of-consciousness - raw, and relatable 
3. Substantiated by clearly cited evidence and sources
4. Must take a side and an opinion - strong POV

## FAQs (?)
1. Heavy internal linking 
2. Clear, direct, succinct answers to the questions
3. No CTAs or product plugs

## News 
1. Internal and external links should be used heavily
2. Tone should be neutral, informational, and succinct. Descriptive
3. Never include a personal opinion or tone

## Whitepapers
1. Tone is authoritative and research based
2. Long word count
3. Heavy emphasis on accurate internal and external linking

## Infographic
1. There should be a clear heading, with visuals which accompany and describe each heading, and corresponding words in bullet point

## Case studies
1. Clearly state how they were aided - how their position improved due to the usage of a certain product or service
2. Internal or external links to the case studies' webpage (if any)
3. Narrative tone
4. Emphasize the experience of the person - using direct quotes from them, and describing how they were aided. 
5. Identify the person by name and position and state the company 

## Press releases (news about the company)
1. Short word count
2. Direct, matter-of-fact tone, formal and restrained
3. State details 
4. Quotes from key personnel

## Interviews
1. External and internal links to the interviewee and related topics
2. Many quotes from the interview
3. Conversational - should be clearly signposted as a back and forth between interviewer and interviewee
4. Introduction setting the scene of the interview - who is being interviewed and what their position and experience is, and when it took place, where. Who was interviewing. 
5. Closing insights stating what was learnt from the interview

## product update
1. Word light 
2. Introduce the product and what it is 
3. Clearly list the changes in the product in a listicle, and list all the features
4. Be clear, and benefit focused
5. Explain why this update is exciting and what it intends to fulfill

## Contest/giveaway
1. Describe what needs to be done to qualify for the giveaway, how many people will win it, when it will close, how much it's worth
2. Very word light 
3. Energetic tone - excited

## Research summary
1. Any original opinions have to be clearly labelled as such
2. External link to the original research
3. Cite clearly and in great detail the original research with 100% accuracy 
4. Analytical and neutral tone

## Event recap
1. Descriptive tone, excited
2. Internal link to related articles and products
3. External link to partners

## Best practices
1. Checklist at the end of the article summarizing all the best practices
2. Prescriptive, confident tone
3. State dos and don'ts 
4. Give examples
</requirements>

<meta>
- Today's date: ${args.utcDate} (UTC timezone)
</meta>`;
  }

  return `<role>
You are an expert AI writing assistant for SEO/GEO content production.

Your job is to help the user draft, edit, and finalize articles inside the project's workspace.

You have two power tools \`read_skills\` and \`use_skills\`. Prefer using them instead of guessing about workspace state.
</role>

<core-behavior>
1. If the user is editing an article, prioritize helping them improve the draft directly (structure, clarity, correctness, SEO, and citations).
2. If the user needs a brief/outline, use \`perform_article_research\` to create a plan under /plans/... first.
3. If the user wants a full draft, use \`write_article_content\` and point it at the plan and article paths.
4. Ask clarifying questions only when absolutely necessary.
5. Keep outputs concise and action-oriented.
</core-behavior>

<skills>
${args.skillsSection}
</skills>

<project-context>
- Today's date: ${args.utcDate} (UTC timezone)
- Website: ${args.project.websiteUrl}${formatBusinessBackground(args.project.businessBackground ?? null)}
- Project name: ${args.project.name ?? "(none)"}
- Writing voice: ${args.project.writingSettings?.brandVoice || "Professional, authoritative, and helpful"}
</project-context>`;
}

export function createWriterAgent({
  messages,
  project,
  publicImagesBucket,
}: {
  messages: SeoChatMessage[];
  project: NonNullable<WebSocketContext["cache"]["project"]>;
  publicImagesBucket: InitialContext["publicImagesBucket"];
}): Parameters<typeof streamText>[0] {
  const utcDate = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  const plannerTools = createPlannerToolsWithMetadata();
  const todoTools = createTodoToolWithMetadata({ messages });

  const fileTools = createFileToolsWithMetadata({
    userId: undefined,
    publishingSettings: project.publishingSettings,
  });
  const webTools = createWebToolsWithMetadata();
  const researchTools = createArticleResearchToolWithMetadata({ project });
  const writingTools = createArticleWritingToolWithMetadata({
    project,
    publicImagesBucket,
  });

  const skillDefinitions: AgentToolDefinition[] = [
    ...fileTools.toolDefinitions,
    ...webTools.toolDefinitions,
    ...researchTools.toolDefinitions,
    ...writingTools.toolDefinitions,
  ];
  const skillsSection = formatToolSkillsSection(skillDefinitions);

  const systemPrompt = buildWriterSystemPrompt({
    project,
    utcDate,
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
