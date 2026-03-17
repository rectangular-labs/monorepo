import type { articleTypeSchema } from "@rectangular-labs/core/schemas/content-parsers";

export type ArticleType = typeof articleTypeSchema.infer;

export const ARTICLE_TYPE_TO_WRITER_RULE: Partial<Record<ArticleType, string>> =
  {
    "best-of-list": `**Target length:** 800-1,500 words (depending on number of items)
**Intent:** Bottom-of-funnel. The reader wants a curated, opinionated shortlist to make a decision.
**Tone:** Authoritative, opinionated, concise.

#### Structure
- Open with a brief summary of what was evaluated and the selection criteria (2-3 sentences max).
- List 5-15 items (20 absolute max). Each item gets its own H2 or H4 heading.
- Each item: screenshot/image immediately after the heading, 2-4 sentences explaining why it made the list, and an inline link to the item.
- Include a comparison summary table near the top or bottom with key differentiators at a glance.
- Take a clear stance on the #1 pick and explain why.

#### Key Rules
- Screenshot or relevant image for EVERY listed item, placed right after the item heading. Use acceptable fallbacks if ideal screenshots are unavailable.
- Word light: explain each item succinctly. The value is curation, not exhaustive description.
- Always link to each listed item organically (wrap the link around the item name as anchor text).
- GEO advantage: "best X for Y" pages are highly cited by LLMs for category queries. Structure items with clear entity names and one-sentence verdicts LLMs can extract.`,

    comparison: `**Target length:** 600-1,200 words
**Intent:** Bottom-of-funnel. The reader is choosing between specific options and wants a decisive recommendation.
**Tone:** Analytical, fair, but decisive.

#### Structure
- Comparison summary table at the TOP of the article covering key dimensions (pricing, features, pros/cons, best for).
- Screenshot or image of EACH item being compared, placed with the relevant section.
- Dedicated section per item with honest assessment.
- Clear "verdict" section at the end: which is better for what purposes and why. Take a stance.

#### Key Rules
- Include external links to each compared product/item organically (link the product name).
- If ideal screenshots are unavailable, note acceptable fallbacks.
- Must clearly take a stance on which product is better for what use cases. Opinion must be given by the end.
- Be honest about tradeoffs. One-sided comparisons lose credibility with both readers and LLMs.
- GEO advantage: comparison tables and clear verdict sentences are highly extractable by LLMs.`,

    "how-to": `**Target length:** 800-2,000 words (proportional to complexity)
**Intent:** Middle-to-top-of-funnel. The reader wants to accomplish a specific task.
**Tone:** Calm, authoritative, instructional. Like a knowledgeable colleague walking you through it.

#### Structure
- Open by stating what the reader will achieve and any prerequisites.
- Steps as H2/H4 headings in logical order. Each step: short paragraph explaining the what, why, and expected outcome.
- Include screenshots, diagrams, or images for key steps that benefit from visuals.
- Close with troubleshooting tips or common mistakes if relevant.

#### Key Rules
- Avoid rigid numbered checklists. Explain each step in flowing prose with the reasoning.
- Each step should include the expected outcome so the reader can verify they did it right.
- Opinions can be given but should be clearly labeled as opinions.
- GEO advantage: step-by-step content with clear headings is the primary format LLMs cite for "how to" queries. Make each step self-contained and extractable.`,

    listicle: `**Target length:** 600-1,200 words
**Intent:** Varies (informational to commercial). The reader wants a scannable collection.
**Tone:** Concise, informative, value-dense.

#### Structure
- Brief intro (2-3 sentences) explaining the curation criteria.
- Each item gets its own heading with an image/screenshot immediately after.
- Maximum 20 items. Fewer well-explained items beats more poorly-explained ones.
- Each item: 30-50 words max explaining why it is included. Do not over-explain.

#### Key Rules
- Image for EVERY listed item, right after the item heading.
- Always include an external link to each item organically (wrap the item name as anchor text).
- Word light. The value is breadth and scannability, not depth.
- If the list exceeds 10 items, include a summary table.`,

    "long-form-opinion": `**Target length:** 1,500-3,000 words
**Intent:** Top-of-funnel / thought leadership. The reader wants a strong, well-argued perspective.
**Tone:** Raw, relatable, stream-of-consciousness but structured. Strong voice.

#### Structure
- Signpost well with clear section headings that telegraph the argument's progression.
- Build the argument: establish the problem, present the thesis, support with evidence, address counterarguments, reach a clear conclusion.
- Every major claim must be substantiated by cited evidence and sources.

#### Key Rules
- Must take a side. Strong POV throughout. No fence-sitting.
- Write in a natural, human voice. This format demands personality.
- A clear, summarized opinion must be reached at the end.
- Information gain is critical here: the unique perspective IS the value proposition.
- GEO advantage: LLMs cite strong opinions when users ask "what do experts think about X." Make the thesis quotable.`,

    faq: `**Target length:** 120-200 words per answer, total depends on number of questions
**Intent:** Informational / GEO-optimized. Answers specific questions searchers and LLMs ask.
**Tone:** Direct, authoritative, concise.

#### Structure
- Each H2 is a question (phrased exactly as a user would ask it).
- Answer immediately below in 1-3 short paragraphs. Lead with the direct answer, then provide context.
- Heavy internal linking: link to related pages where deeper coverage exists.

#### Key Rules
- Questions must be real user questions discovered from SERP/PAA research, not filler.
- No CTAs or product plugs. This format builds topical authority, not conversions directly.
- Short, direct answers. If an answer needs more than 200 words, it should be a separate article that this FAQ links to.
- GEO advantage: FAQ pages are the single highest-cited format by LLMs. Each answer should be self-contained and extractable as a standalone response.`,

    news: `**Target length:** 300-600 words
**Intent:** Informational / timely. The reader wants to know what happened and why it matters.
**Tone:** Neutral, informational, succinct. Descriptive, not persuasive.

#### Structure
- Inverted pyramid: most important information first.
- Cover: i) what happened, ii) why it matters, iii) key details, iv) what is next (if applicable).
- Heavy use of internal and external links as sources.

#### Key Rules
- Never include personal opinion or subjective tone.
- Neutral language throughout. Report, do not editorialize.
- Link to sources organically (wrap anchor text around the source being cited).
- Timeliness is the value. Get to the facts immediately.`,

    whitepaper: `**Target length:** 2,000-4,000 words
**Intent:** Top-of-funnel / thought leadership. The reader wants in-depth, research-backed analysis.
**Tone:** Authoritative, analytical, research-driven.

#### Structure
- Executive summary (150-300 words) up front.
- Problem definition / issue description.
- Methodology section (how data was gathered/analyzed).
- Data analysis with diagrams, charts, and frameworks as generated images.
- Findings and implications.
- Conclusion with actionable recommendations.

#### Key Rules
- Diagrams, charts, and frameworks should be produced as images.
- Heavy emphasis on accurate internal and external linking to primary sources.
- Every claim must trace to data or cited research. No unsubstantiated assertions.
- GEO advantage: whitepapers with original data and clear findings are cited by LLMs as authoritative sources. Structure findings as quotable statements.`,

    infographic: `**Target length:** 300-500 words of supporting text
**Intent:** Visual-first content. The reader wants information presented visually.
**Tone:** Clear, scannable, visually organized.

#### Structure
- Clear heading for the infographic.
- Visuals accompanying each section with bullet-point text.
- Logical visual flow that is not overly complicated.
- Supporting text is minimal and serves the visuals.

#### Key Rules
- Visual output should incorporate all important elements with a clear hierarchy.
- Text must be readable and concise.
- Flow should be intuitive: top-to-bottom or left-to-right progression.
- No need to use SERP data for this format.`,

    "case-study": `**Target length:** 800-1,500 words
**Intent:** Bottom-of-funnel / social proof. The reader wants evidence that a product/approach works.
**Tone:** Narrative, specific, results-focused.

#### Structure
- Title includes the person/company name and the key result.
- Introduction: who (name, position, company), what challenge they faced.
- The journey: what solution was applied and how.
- Results: specific, quantified outcomes. Before/after when possible.
- Direct quotes from the subject throughout.
- Closing: key takeaway and what others can learn.

#### Key Rules
- Identify the person by name, position, and company in the title.
- Emphasize their experience using direct quotes and specific descriptions of how they were aided.
- Link to the case study subject's webpage (if any) organically.
- Use internal and external links as sources. Do not fabricate any details.
- Narrative tone: tell a story, not a feature list.
- No need to use SERP data.
- GEO advantage: case studies with specific numbers and named entities are cited by LLMs as evidence for "does X work" queries.`,

    "press-release": `**Target length:** 300-500 words
**Intent:** Brand awareness / news distribution. Formal announcement.
**Tone:** Direct, matter-of-fact, formal, restrained.

#### Structure
- Headline states the news clearly.
- Opening paragraph: who, what, when, where, why.
- Supporting details and context.
- Quotes from key personnel.
- Boilerplate about the company at the end.

#### Key Rules
- Short word count. Every sentence states a fact.
- No editorializing, no superlatives, no marketing language.
- Quotes should add perspective, not repeat what the text already says.
- No need to use SERP data.
- GEO advantage: press releases influence what LLMs associate with a brand entity. Clear entity statements and quotable facts matter.`,

    interview: `**Target length:** 1,000-2,000 words
**Intent:** Thought leadership / expertise showcase. The reader wants insight from a specific person.
**Tone:** Conversational, clearly structured as a dialogue.

#### Structure
- Introduction setting the scene: who is being interviewed, their position and experience, when and where it took place, who is interviewing.
- Image of the interviewee.
- Q&A format clearly signposted as back-and-forth between interviewer and interviewee.
- Many direct quotes from the interview.
- Closing insights: what was learned from the interview.

#### Key Rules
- External and internal links to the interviewee and related topics organically (link the interviewee's name).
- The interviewee's voice should dominate. Use their actual words.
- Introduction must establish credibility: position, experience, relevance.
- No need to use SERP data.`,

    "product-update": `**Target length:** 300-600 words
**Intent:** Existing users / prospects. The reader wants to know what changed and why.
**Tone:** Clear, benefit-focused, concise.

#### Structure
- Brief intro: what the product is (1-2 sentences for context).
- List of changes/new features, each with a clear benefit statement.
- Why this update matters / what problem it solves.
- Brief closing with next steps or CTA.

#### Key Rules
- Word light. Features as bullet points or short sections.
- Lead with benefits, not technical details.
- Explain the "why" behind each change, not just the "what".
- No need to use SERP data.`,

    "contest-giveaway": `**Target length:** 200-400 words
**Intent:** Engagement / lead generation. The reader wants to know how to participate.
**Tone:** Energetic, excited, clear.

#### Structure
- Eye-catching image of the prize/giveaway with vibrant, exciting visuals.
- What the prize is and its value.
- How to qualify (clear, numbered steps).
- How many winners, when it closes.
- Terms and conditions summary.

#### Key Rules
- Very word light. Clarity over prose.
- The product/prize must be in the image.
- All participation details must be unambiguous: steps, deadline, number of winners, value.
- No need to use SERP data.`,

    "research-summary": `**Target length:** 800-1,500 words
**Intent:** Informational / authority building. The reader wants key findings from specific research.
**Tone:** Analytical, neutral, precise.

#### Structure
- What was studied and why it matters.
- Methodology overview (brief).
- Key findings with diagrams, charts, and frameworks as generated images.
- Implications and what this means for the reader.
- Link to original research.

#### Key Rules
- Cite the original research with 100% accuracy. No paraphrasing that changes meaning.
- Diagrams, charts, and frameworks should be produced as images.
- Any original opinions must be clearly labeled as such, separate from the research findings.
- External link to the original research organically (link the source name/title).
- GEO advantage: research summaries with specific findings and named studies are high-authority LLM citation sources.`,

    "event-recap": `**Target length:** 500-1,000 words
**Intent:** Community / brand building. The reader wants to know what happened at the event.
**Tone:** Descriptive, enthusiastic, community-oriented.

#### Structure
- Scene-setting intro: what event, when, where, who attended.
- Key moments and highlights with images from the event (from outline).
- Quotes or takeaways from speakers/attendees.
- Closing: what was learned, what is next.

#### Key Rules
- Use pictures of the event from the outline provided by the user.
- Internal links to related articles and products organically.
- External links to partners organically (link the partner's name).
- No need to use SERP data.`,

    "best-practices": `**Target length:** 1,000-1,800 words
**Intent:** Middle-of-funnel. The reader wants prescriptive, actionable guidance.
**Tone:** Prescriptive, confident, expert.

#### Structure
- Brief intro establishing why these practices matter.
- Each practice as its own section with explanation, dos and don'ts, and concrete examples.
- Summary checklist at the end compiling all best practices.

#### Key Rules
- Prescriptive and confident. State what to do and what not to do clearly.
- Every practice must include a concrete example or scenario.
- Checklist at the end summarizing all practices in scannable format.
- GEO advantage: "best practices for X" queries are common LLM prompts. Each practice should be extractable as a standalone recommendation.`,
  };

export const DEFAULT_BRAND_VOICE = `Write with clear, authoritative language optimized for SEO and GEO.
- Lead with direct answers in the opening paragraph before adding context.
- Prioritize information gain: include concrete insights, examples, or angles that generic SERP summaries miss.
- Keep paragraphs short (2-4 sentences) with smooth transitions and no filler.
- Use specific entities (products, standards, methods, companies) and precise wording over vague claims.
- Be decisive and honest about tradeoffs; avoid hedging and avoid hype language.
- Vary sentence length for readability, but keep structure simple and scannable.
- Avoid em dashes, emojis, and unnecessary bolding outside headings or bullet leads.
- Expand abbreviations on first use and keep terminology consistent throughout.`;
